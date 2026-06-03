package com.finflow.auth.service;

import com.finflow.auth.dto.*;
import com.finflow.notification.dto.NotificationRequest;
import com.finflow.auth.entity.User;
import com.finflow.auth.repository.UserRepository;
import com.finflow.auth.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.finflow.auth.exception.AuthException;
import com.finflow.auth.exception.UserNotFoundException;

import com.finflow.auth.entity.UserOtp;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Service
@Slf4j
@SuppressWarnings("null")
public class AuthService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PENDING_ADMIN_APPROVAL = "ADMIN_APPROVAL_PENDING";
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_APPLICANT = "APPLICANT";
    private static final String STATUS_UNVERIFIED = "UNVERIFIED";
    private static final String MSG_USER_NOT_FOUND = "User not found";
    private static final String KEY_TIMESTAMP = "timestamp";
    private static final String KEY_MESSAGE = "message";
    private static final String TEMPLATE_REGISTRATION = "registration-template";

    private static final Random RANDOM = new Random();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;
    private final com.finflow.auth.repository.UserOtpRepository otpRepository;
    private final com.finflow.auth.repository.UserLoginRepository loginRepository;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.notification.exchanges.notification:notification-exchange}")
    private String notificationExchange;

    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.notification.routing-keys.registration:notification.registration}")
    private String registrationRoutingKey;

    @org.springframework.beans.factory.annotation.Value("${spring.rabbitmq.notification.routing-keys.login:notification.login}")
    private String loginRoutingKey;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            @org.springframework.context.annotation.Lazy org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate,
            com.finflow.auth.repository.UserOtpRepository otpRepository,
            com.finflow.auth.repository.UserLoginRepository loginRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.rabbitTemplate = rabbitTemplate;
        this.otpRepository = otpRepository;
        this.loginRepository = loginRepository;
    }

    /**
     * Entry point for new user registration.
     * We use @Transactional here to ensure that if the DB save fails, 
     * we don't accidentally send a 'Welcome' email or mess up the state.
     */
    @Transactional
    public String signup(String registerAs, SignupRequest request) {
        User user = registerUser(registerAs, request);
        return "User registered successfully. ID: " + (user != null ? user.getId() : "Unknown");
    }

    /**
     * The actual heavy lifting for registration. 
     * Handles normalization, existence checks, and the initial status setting.
     */
    @Transactional
    public User registerUser(String registerAs, SignupRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new AuthException("Email is required");
        }

        // Always normalize email (lowercase/trim) to avoid "User@Gmail.com" 
        // being treated as different from "user@gmail.com".
        String email = normalizeEmail(request.getEmail());
        
        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email)
                    .orElseThrow(() -> new AuthException("This email is already registered. Please login instead."));
            
            // If the user previously started registration but never verified their OTP,
            // we allow them to "refresh" their registration instead of blocking them.
            if (isUnverified(existing)) {
                log.info("CORE_REG: Unverified re-registration attempt for {}. Refreshing registration.", existing.getEmail());
                User savedExisting = refreshPendingRegistration(existing, registerAs, request);
                return savedExisting;
            }
            throw new AuthException("This email is already registered. Please login instead.");
        }

        boolean isAdmin = ROLE_ADMIN.equalsIgnoreCase(registerAs);

        // Map the DTO to our JPA Entity. We use BCrypt (via passwordEncoder) 
        // to hash the password before it ever touches the database.
        User user = User.builder()
                .fullName(request.getFullName())
                .email(email)
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(isAdmin ? ROLE_ADMIN : ROLE_APPLICANT)
                .status(STATUS_UNVERIFIED)
                .build();

        User savedUser = userRepository.save(user);
        log.info("CORE_REG: Saved user: {} with role: {} and status: {}", savedUser.getEmail(), savedUser.getRole(),
                savedUser.getStatus());

        // Generate a 6-digit OTP and send it via RabbitMQ.
        // Doing this asynchronously means the user doesn't wait for the email to send.
        String regOtp = issueRegistrationOtp(savedUser.getEmail());
        sendRegistrationOtp(savedUser, regOtp, "VERIFICATION REQUIRED: Activate Your FinFlow Account");

        return savedUser;
    }

    private User refreshPendingRegistration(User existing, String registerAs, SignupRequest request) {
        boolean isAdmin = ROLE_ADMIN.equalsIgnoreCase(registerAs);
        existing.setFullName(request.getFullName());
        existing.setPhone(request.getPhone());
        existing.setPassword(passwordEncoder.encode(request.getPassword()));
        existing.setRole(isAdmin ? ROLE_ADMIN : ROLE_APPLICANT);
        existing.setStatus(STATUS_UNVERIFIED);
        existing.setApprovedBy(null);
        existing.setApprovedAt(null);

        User savedUser = userRepository.save(existing);
        String regOtp = issueRegistrationOtp(savedUser.getEmail());
        sendRegistrationOtp(savedUser, regOtp, "New Verification Code - FinFlow");
        log.info("CORE_REG: Refreshed unverified registration for {}", savedUser.getEmail());
        return savedUser;
    }

    private String issueRegistrationOtp(String email) {
        otpRepository.deleteByEmailAndPurpose(email, UserOtp.OtpPurpose.REGISTRATION);
        String regOtp = String.format("%06d", RANDOM.nextInt(999999));
        UserOtp userOtp = UserOtp.builder()
                .email(email)
                .otp(regOtp)
                .purpose(UserOtp.OtpPurpose.REGISTRATION)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(userOtp);
        return regOtp;
    }

    private void sendRegistrationOtp(User user, String regOtp, String subject) {
        try {
            Map<String, Object> model = new java.util.HashMap<>();
            model.put("name", user.getFullName());
            model.put("email", user.getEmail());
            model.put("otp", regOtp);

            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject(subject)
                    .templateName(TEMPLATE_REGISTRATION)
                    .model(model)
                    .build();

            log.info("RABBIT_SEND: Dispatching registration OTP email for {} (Role: {})", user.getEmail(),
                    user.getRole());
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, notification);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Could not send registration OTP for {}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Transactional
    public void resendSignupOtp(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (!isUnverified(user)) {
            throw new AuthException("Account is already verified or active. Status: " + user.getStatus());
        }

        String regOtp = issueRegistrationOtp(user.getEmail());
        sendRegistrationOtp(user, regOtp, "ACTION REQUIRED: New Verification Code for FinFlow");
    }

    @Transactional
    public void verifyRegistration(String email, String otp) {
        String normalizedEmail = normalizeEmail(email);
        UserOtp userOtp = otpRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByExpiryTimeDesc(normalizedEmail,
                        UserOtp.OtpPurpose.REGISTRATION)
                .filter(o -> !o.isExpired())
                .filter(o -> o.getOtp().equals(otp))
                .orElseThrow(() -> new AuthException("Invalid or expired OTP"));

        userOtp.setVerified(true);
        otpRepository.save(userOtp);

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new AuthException(MSG_USER_NOT_FOUND));

        if (isUnverified(user)) {
            boolean isAdmin = ROLE_ADMIN.equalsIgnoreCase(user.getRole());
            user.setStatus(isAdmin ? STATUS_PENDING_ADMIN_APPROVAL : STATUS_ACTIVE);
            userRepository.save(user);
            log.info("VERIFY_REG: User {} (Role: {}) verified email. Status set to: {}", email, user.getRole(),
                    user.getStatus());

            try {
                NotificationRequest successMail = NotificationRequest.builder()
                        .to(user.getEmail())
                        .subject(isAdmin ? "Email Verified - Admin Approval Pending"
                                : "Account Activated - Welcome to FinFlow!")
                        .templateName(TEMPLATE_REGISTRATION)
                        .model(java.util.Map.of("name", user.getFullName()))
                        .build();
                rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, successMail);

                if (isAdmin) {
                    NotificationRequest adminAlert = NotificationRequest.builder()
                            .to("durgaprasadch.in@gmail.com")
                            .subject("ACTION REQUIRED: New Admin Verified & Pending Approval")
                            .templateName("admin-alert-template")
                            .model(Map.of(
                                    "name", "Super Admin",
                                    "applicationId", "USER-" + user.getId(),
                                    "status", "ADMIN_VERIFIED_PENDING_APPROVAL",
                                    KEY_TIMESTAMP,
                                    LocalDateTime.now().format(
                                            java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))))
                            .build();
                    rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, adminAlert);
                    log.info("RABBIT_SEND: Admin Alert dispatched to super-admin for verified admin: {}", email);
                }
            } catch (Exception e) {
                log.error("RABBIT_FAILED: Could not send success/alert emails for {}: {}", email, e.getMessage());
            }
        }
    }

    /**
     * Primary login flow. 
     * We support Multi-Factor Authentication (MFA) by default.
     */
    @Transactional
    public LoginResponse login(LoginRequest request) {
        // 1. Basic validation: Does the user exist?
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .orElseThrow(() -> new AuthException("No user found. Please register first."));

        // 2. State check: Unverified users shouldn't be logging in.
        if (isUnverified(user)) {
            throw new AuthException("Account is not verified. Please complete OTP verification.");
        }

        // 3. Security check: Compare hashed passwords. 
        // BCrypt is slow by design to prevent brute-force attacks.
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthException("Invalid credentials");
        }

        // 4. Status check: Account must be ACTIVE or APPROVED.
        String status = user.getStatus();
        if (!STATUS_ACTIVE.equalsIgnoreCase(status) && !"APPROVED".equalsIgnoreCase(status)
                && !"APPROVE".equalsIgnoreCase(status)) {
            throw new AuthException("Account is " + status);
        }

        // 5. TEST ACCOUNT BYPASS:
        // For development speed, we skip MFA for these specific internal accounts.
        // In a real prod app, this would be handled via environment flags.
        if ("test@finflow.in".equalsIgnoreCase(user.getEmail()) || "admin@finflow.in".equalsIgnoreCase(user.getEmail())) {
            String token = jwtService.generateToken(user.getEmail(), user.getRole(), user.getId());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            user.setRefreshToken(refreshToken);
            userRepository.save(user);
            log.info("LOGIN_BYPASS: Bypassing MFA for test user {}", user.getEmail());
            return LoginResponse.builder()
                    .accessToken(token)
                    .refreshToken(refreshToken)
                    .mfaRequired(false)
                    .role(user.getRole())
                    .build();
        }

        // 6. Security Audit: Record that this person attempted to log in.
        recordLogin(user.getId(), request.getIpAddress(), request.getUserAgent());

        // 7. MFA Initiation: Generate an OTP and tell the frontend that MFA is required.
        String otp = String.format("%06d", RANDOM.nextInt(999999));
        otpRepository.deleteByEmailAndPurpose(user.getEmail(), UserOtp.OtpPurpose.LOGIN);
        UserOtp userOtp = UserOtp.builder()
                .email(user.getEmail())
                .otp(otp)
                .purpose(UserOtp.OtpPurpose.LOGIN)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();
        otpRepository.save(userOtp);

        try {
            // Drop a message into RabbitMQ so the Notification Service sends the email.
            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject("Secured Login Verification - FinFlow")
                    .templateName("otp-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            "otp", otp,
                            KEY_MESSAGE, "A secure login request"))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, loginRoutingKey, notification);
            log.info("RABBIT_SEND: Login OTP dispatched for {}", user.getEmail());
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Failed to send login OTP: {}", e.getMessage());
        }

        return LoginResponse.builder()
                .mfaRequired(true)
                .role(user.getRole())
                .build();
    }

    @Transactional
    public LoginResponse verifyLoginOtp(String email, String otp) {
        UserOtp userOtp = otpRepository
                .findTopByEmailAndPurposeOrderByExpiryTimeDesc(email.toLowerCase(), UserOtp.OtpPurpose.LOGIN)
                .orElseThrow(() -> new AuthException("Login verification session expired or not found"));

        if (userOtp.isExpired() || !userOtp.getOtp().equals(otp)) {
            throw new AuthException("Invalid or expired verification code");
        }

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UserNotFoundException(MSG_USER_NOT_FOUND));

        // Generate final JWTs
        String token = jwtService.generateToken(user.getEmail(), user.getRole(), user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Save refresh token to user
        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        otpRepository.deleteByEmailAndPurpose(user.getEmail(), UserOtp.OtpPurpose.LOGIN);

        log.info("AUTH_SUCCESS: 2FA completed for {}", email);

        try {
            NotificationRequest successNotify = NotificationRequest.builder()
                    .to(email)
                    .subject("New Login Detected - FinFlow Audit")
                    .templateName("login-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            KEY_TIMESTAMP,
                            LocalDateTime.now()
                                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                            "role", user.getRole()))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, loginRoutingKey, successNotify);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Could not send login success email: {}", e.getMessage());
        }

        return LoginResponse.builder()
                .accessToken(token)
                .refreshToken(refreshToken)
                .tokenType(LoginResponse.TOKEN_TYPE_BEARER)
                .expiresIn(86400)
                .role(user.getRole())
                .mfaRequired(false)
                .build();
    }

    @Transactional
    public LoginResponse refresh(String refreshToken) {
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Invalid refresh token user"));

        if (user.getRefreshToken() == null || !refreshToken.equals(user.getRefreshToken())) {
            throw new AuthException("Refresh token mismatch or revoked");
        }

        String newAccessToken = jwtService.generateToken(user.getEmail(), user.getRole(), user.getId());
        String newRefreshToken = jwtService.generateRefreshToken(user.getEmail());
        
        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(user.getRole())
                .expiresIn(86400)
                .build();
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new UserNotFoundException("User not registered with this email"));

        String otp = String.format("%06d", RANDOM.nextInt(999999));
        otpRepository.deleteByEmailAndPurpose(email.toLowerCase(), UserOtp.OtpPurpose.FORGOT_PASSWORD);
        UserOtp userOtp = UserOtp.builder()
                .email(email.toLowerCase())
                .otp(otp)
                .purpose(UserOtp.OtpPurpose.FORGOT_PASSWORD)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();
        otpRepository.save(userOtp);

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject("Identity Verification - FinFlow")
                    .templateName("otp-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            "otp", otp,
                            KEY_MESSAGE, "A password reset request"))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, loginRoutingKey, notification);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Failed to send OTP email: {}", e.getMessage());
        }
    }

    @Transactional
    public String verifyOtp(String email, String otp) {
        UserOtp userOtp = otpRepository
                .findTopByEmailAndPurposeOrderByExpiryTimeDesc(email.toLowerCase(), UserOtp.OtpPurpose.FORGOT_PASSWORD)
                .orElseThrow(() -> new AuthException("No OTP found for this email"));

        if (userOtp.isExpired()) {
            throw new AuthException("OTP has expired. Please request a new one.");
        }
        if (!userOtp.getOtp().equals(otp)) {
            throw new AuthException("Invalid OTP code");
        }

        String resetToken = java.util.UUID.randomUUID().toString();
        userOtp.setVerified(true);
        userOtp.setResetToken(resetToken);
        otpRepository.save(userOtp);

        return resetToken;
    }

    @Transactional
    public void resetPassword(String resetToken, String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new AuthException("Passwords do not match");
        }

        UserOtp userOtp = otpRepository.findByResetToken(resetToken)
                .orElseThrow(() -> new AuthException("Invalid or expired reset token"));

        if (userOtp.isExpired()) {
            otpRepository.delete(userOtp);
            throw new AuthException("Reset token has expired");
        }

        if (!userOtp.isVerified()) {
            throw new AuthException("Identity verification required");
        }

        User user = userRepository.findByEmail(userOtp.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User associated with this token no longer exists"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject("Password Changed Successfully - FinFlow")
                    .templateName("password-reset-success-template")
                    .model(java.util.Map.of("name", user.getFullName(), KEY_TIMESTAMP, LocalDateTime.now().toString()))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, notification);
        } catch (Exception e) {
            log.error("Failed to send password reset success email: {}", e.getMessage());
        }

        otpRepository.deleteByEmailAndPurpose(user.getEmail(), UserOtp.OtpPurpose.FORGOT_PASSWORD);
    }

    @Transactional
    public void requestDeleteAccount(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new AuthException(MSG_USER_NOT_FOUND));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthException("Identity verification failed: Invalid password");
        }

        otpRepository.deleteByEmailAndPurpose(email.toLowerCase(), UserOtp.OtpPurpose.DELETE_ACCOUNT);
        String otp = String.format("%06d", RANDOM.nextInt(999999));
        log.info("SECURITY_ALERT: Account deletion OTP generated for {}: {}", email, otp);

        UserOtp userOtp = UserOtp.builder()
                .email(email.toLowerCase())
                .otp(otp)
                .purpose(UserOtp.OtpPurpose.DELETE_ACCOUNT)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(userOtp);

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(email)
                    .subject("CRITICAL: Confirm Final Account Deletion - FinFlow")
                    .templateName("delete-account-template")
                    .model(java.util.Map.of("name", user.getFullName(), "otp", otp))
                    .build();
            
            log.info("RABBIT_SEND: Dispatching delete OTP for {}", email);
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, notification);
        } catch (Exception e) {
            log.warn("RABBIT_FAILED: Falling back to REST for delete OTP for {}: {}", email, e.getMessage());
            try {
                NotificationRequest notification = NotificationRequest.builder()
                        .to(email)
                        .subject("CRITICAL: Confirm Final Account Deletion - FinFlow")
                        .templateName("delete-account-template")
                        .model(java.util.Map.of("name", user.getFullName(), "otp", otp))
                        .build();
                restTemplate.postForEntity("http://localhost:8085/api/notifications/send", notification, String.class);
                log.info("REST_FALLBACK_SUCCESS: Delete OTP sent via REST to notification-service");
            } catch (Exception ex) {
                log.error("REST_FALLBACK_FAILED: Could not send delete OTP even via REST: {}", ex.getMessage());
            }
        }
    }

    @Transactional
    public void verifyDeleteAccount(String email, String otp) {
        UserOtp userOtp = otpRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByExpiryTimeDesc(email.toLowerCase(),
                        UserOtp.OtpPurpose.DELETE_ACCOUNT)
                .filter(o -> !o.isExpired() && o.getOtp().equals(otp))
                .orElseThrow(() -> new AuthException("Invalid or expired deletion code"));

        userOtp.setVerified(true);
        otpRepository.save(userOtp);

        User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new AuthException(MSG_USER_NOT_FOUND));

        try {
            NotificationRequest farewell = NotificationRequest.builder()
                    .to(email)
                    .subject("Final Confirmation: FinFlow Account & Data Purged")
                    .templateName("account-purged-template")
                    .model(Map.of("name", user.getFullName()))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, farewell);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Could not send farewell email for {}: {}", email, e.getMessage());
        }

        otpRepository.deleteByEmail(email.toLowerCase());
        userRepository.delete(user);
    }

    @Transactional
    public void updateUserStatus(String userId, String status) {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new AuthException("User not found: " + userId));

        String normalizedStatus = status.trim().toUpperCase();
        if ("APPROVE".equals(normalizedStatus) || "APPROVED".equals(normalizedStatus)) {
            normalizedStatus = STATUS_ACTIVE;
        }

        user.setStatus(normalizedStatus);
        userRepository.save(user);

        try {
            boolean isAdmin = ROLE_ADMIN.equalsIgnoreCase(user.getRole());
            boolean isApproved = STATUS_ACTIVE.equalsIgnoreCase(normalizedStatus);
            String subject = determineAccountStatusSubject(isAdmin, isApproved);
            String template = isAdmin ? "admin-alert-template" : TEMPLATE_REGISTRATION;
            String message = determineAccountStatusMessage(isAdmin, isApproved, status);

            NotificationRequest activationMail = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject(subject)
                    .templateName(template)
                    .model(Map.of("name", user.getFullName(), "status", isAdmin ? "ADMIN_" + status.toUpperCase() : status.toUpperCase(), KEY_MESSAGE, message))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, activationMail);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Account status mail failed for {}: {}", user.getEmail(), e.getMessage());
        }
    }

    private String determineAccountStatusSubject(boolean isAdmin, boolean isApproved) {
        if (isAdmin) return isApproved ? "Administrator Account Approved - FinFlow" : "Update: Your Administrator Account Status";
        return isApproved ? "Account Activated! Your FinFlow Access is Live" : "Update: Your FinFlow Application Status";
    }

    private String determineAccountStatusMessage(boolean isAdmin, boolean isApproved, String originalStatus) {
        if (isApproved) return isAdmin ? "Your administrative credentials have been approved and are now active." : "Your application account is now fully active.";
        return "An administrative decision has been made regarding your " + (isAdmin ? "admin" : "applicant") + " account. Current status: " + originalStatus.toUpperCase();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private boolean isUnverified(User user) {
        return user != null && user.getStatus() != null && STATUS_UNVERIFIED.equalsIgnoreCase(user.getStatus());
    }

    @Transactional
    public void promoteToAdmin(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if (ROLE_ADMIN.equalsIgnoreCase(user.getRole())) {
            throw new AuthException("User is already an administrator");
        }

        user.setRole(ROLE_ADMIN);
        userRepository.save(user);
        log.info("ROLE_CHANGE: User {} promoted to ADMIN", user.getEmail());

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject("Account Promotion: You are now an Administrator")
                    .templateName("otp-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            KEY_MESSAGE, "Your account has been promoted to Administrator. You now have access to the Admin Dashboard."))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, notification);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Promotion notification failed for {}: {}", user.getEmail(), e.getMessage());
        }
    }

    @Transactional
    public void demoteToUser(String email) {
        String normalizedEmail = normalizeEmail(email);
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + email));

        if ("durgaprasadch.in@gmail.com".equalsIgnoreCase(normalizedEmail)) {
            throw new AuthException("Critical security failure: Cannot demote the primary system authority.");
        }

        if (ROLE_APPLICANT.equalsIgnoreCase(user.getRole())) {
            throw new AuthException("User is already an applicant");
        }

        user.setRole(ROLE_APPLICANT);
        userRepository.save(user);
        log.info("ROLE_CHANGE: User {} demoted to APPLICANT", user.getEmail());

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(user.getEmail())
                    .subject("Account Update: Administrative Access Revoked")
                    .templateName("otp-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            KEY_MESSAGE, "Your administrative access has been revoked. Your account has been returned to standard Applicant status."))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, notification);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Demotion notification failed for {}: {}", user.getEmail(), e.getMessage());
        }
    }

    public List<User> getAllAdminUsers() { return userRepository.findAllByRole(ROLE_ADMIN); }
    public List<User> getActiveAdminUsers() { return userRepository.findAllByRoleAndStatus(ROLE_ADMIN, STATUS_ACTIVE); }
    public List<User> getAllUsers() { return userRepository.findAll(); }

    @Transactional
    public void recordLogin(java.util.UUID userId, String ip, String userAgent) {
        com.finflow.auth.entity.UserLogin login = com.finflow.auth.entity.UserLogin.builder()
                .userId(userId)
                .ipAddress(ip)
                .userAgent(userAgent)
                .build();
        loginRepository.save(login);
    }

    public List<com.finflow.auth.entity.UserLogin> getLastLogins(java.util.UUID userId) {
        return loginRepository.findTop3ByUserIdOrderByLoginTimeDesc(userId);
    }

    @Transactional
    public void updateProfile(java.util.UUID userId, String fullName, String phone) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(MSG_USER_NOT_FOUND));
        user.setFullName(fullName);
        user.setPhone(phone);
        userRepository.save(user);
    }

    @Transactional
    public void initiateEmailUpdate(java.util.UUID userId, String newEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(MSG_USER_NOT_FOUND));
        
        String normalizedEmail = normalizeEmail(newEmail);
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new AuthException("Email is already in use");
        }

        String otp = String.format("%06d", RANDOM.nextInt(999999));
        otpRepository.deleteByEmailAndPurpose(normalizedEmail, com.finflow.auth.entity.UserOtp.OtpPurpose.UPDATE_EMAIL);
        
        com.finflow.auth.entity.UserOtp userOtp = com.finflow.auth.entity.UserOtp.builder()
                .email(normalizedEmail)
                .otp(otp)
                .purpose(com.finflow.auth.entity.UserOtp.OtpPurpose.UPDATE_EMAIL)
                .expiryTime(LocalDateTime.now().plusMinutes(10))
                .build();
        otpRepository.save(userOtp);

        try {
            NotificationRequest notification = NotificationRequest.builder()
                    .to(normalizedEmail)
                    .subject("Verify Your New Email - FinFlow")
                    .templateName("otp-template")
                    .model(Map.of(
                            "name", user.getFullName(),
                            "otp", otp,
                            KEY_MESSAGE, "A request to change your account email"))
                    .build();
            rabbitTemplate.convertAndSend(notificationExchange, loginRoutingKey, notification);
        } catch (Exception e) {
            log.error("RABBIT_FAILED: Email update OTP failed: {}", e.getMessage());
        }
    }

    @Transactional
    public void confirmEmailUpdate(java.util.UUID userId, String otp, String newEmail) {
        String normalizedEmail = normalizeEmail(newEmail);
        com.finflow.auth.entity.UserOtp userOtp = otpRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByExpiryTimeDesc(normalizedEmail, com.finflow.auth.entity.UserOtp.OtpPurpose.UPDATE_EMAIL)
                .filter(o -> !o.isExpired() && o.getOtp().equals(otp))
                .orElseThrow(() -> new AuthException("Invalid or expired verification code"));

        userOtp.setVerified(true);
        otpRepository.save(userOtp);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(MSG_USER_NOT_FOUND));
        
        user.setEmail(normalizedEmail);
        userRepository.save(user);
        
        otpRepository.deleteByEmailAndPurpose(normalizedEmail, com.finflow.auth.entity.UserOtp.OtpPurpose.UPDATE_EMAIL);
    }
}
