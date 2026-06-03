package com.finflow.auth.controller;

import com.finflow.auth.dto.ApiResponse;
import com.finflow.auth.dto.LoginRequest;
import com.finflow.auth.dto.LoginResponse;
import com.finflow.auth.dto.LoginResponseData;
import com.finflow.auth.dto.PasswordResetRequest;
import com.finflow.auth.dto.SignupRequest;
import com.finflow.auth.dto.SignupResponseData;
import com.finflow.auth.entity.User;
import com.finflow.auth.service.AuthService;
import com.finflow.auth.dto.ProfileUpdateRequest;
import com.finflow.auth.dto.EmailUpdateRequest;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class ApplicantAuthController {

    private final AuthService authService;

    public ApplicantAuthController(AuthService authService) {
        this.authService = authService;
    }

    @Tag(name = "Registration & Activation")
    @Operation(summary = "Register user (defaults to Applicant)")
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<SignupResponseData>> signup(
            @jakarta.validation.Valid @RequestBody SignupRequest request) {
        User user = authService.registerUser("APPLICANT", request);
        String message = "Registration successful. Please verify your email with the OTP sent to you.";
        return ResponseEntity.status(201).body(ApiResponse.success(
                message,
                new SignupResponseData(user.getId(), user.getStatus())));
    }

    @Tag(name = "Registration & Activation")
    @Operation(summary = "Verify Registration OTP", description = "Activate your account by verifying the 6-digit code received via email.")
    @PostMapping("/signup/verify")
    public ResponseEntity<ApiResponse<String>> verifySignup(
            @RequestBody PasswordResetRequest.VerifyRequest request) {
        authService.verifyRegistration(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success(
                "Account activated successfully. You can now login.", "ACTIVE"));
    }

    @Tag(name = "Registration & Activation")
    @Operation(summary = "Resend Registration OTP", description = "If you didn't receive the initial verification code, use this to request a new one.")
    @PostMapping("/signup/resend-otp")
    public ResponseEntity<ApiResponse<String>> resendOtp(@RequestParam String email) {
        authService.resendSignupOtp(email);
        return ResponseEntity.ok(ApiResponse.success("A new verification code has been sent to " + email, null));
    }

    @Tag(name = "Secure Login & 2FA")
    @Operation(summary = "Login user and initiate 2FA")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponseData>> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(
                response.isMfaRequired() ? "2FA_REQUIRED: Please enter the code sent to your email"
                        : "Login successful",
                new LoginResponseData(response.getAccessToken(), response.isMfaRequired())));
    }

    @Tag(name = "Secure Login & 2FA")
    @Operation(summary = "Verify Login OTP", description = "Complete the 2FA login by verifying the OTP received via email.")
    @PostMapping("/login/verify")
    public ResponseEntity<ApiResponse<LoginResponse>> verifyLogin(@RequestBody java.util.Map<String, String> request) {
        LoginResponse response = authService.verifyLoginOtp(request.get("email"), request.get("otp"));
        return ResponseEntity.ok(ApiResponse.success("2FA verification successful", response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@RequestBody java.util.Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null) {
            throw new com.finflow.auth.exception.AuthException("Refresh token is required");
        }
        LoginResponse response = authService.refresh(refreshToken);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    @Tag(name = "Account Recovery")
    @Operation(summary = "Forgot Password", description = "Initiate password reset by sending a 6-digit OTP to user email.")
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody PasswordResetRequest.ForgotRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok("OTP sent successfully to " + request.getEmail());
    }

    @Tag(name = "Account Recovery")
    @Operation(summary = "Verify Reset OTP", description = "Verify the 6-digit OTP and receive a secure Reset Token.")
    @PostMapping("/verify-otp")
    public ResponseEntity<java.util.Map<String, String>> verifyOtp(
            @RequestBody PasswordResetRequest.VerifyRequest request) {
        String resetToken = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(java.util.Map.of(
                "message", "OTP verified successfully",
                "resetToken", resetToken));
    }

    @Tag(name = "Account Recovery")
    @Operation(summary = "Reset Password", description = "Reset the user's password using the secure Reset Token.")
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordResetRequest.ResetRequest request) {
        authService.resetPassword(request.getResetToken(), request.getNewPassword(), request.getConfirmPassword());
        return ResponseEntity.ok("Password reset successfully. Please login with your new password.");
    }

    @Tag(name = "User Account Management")
    @Operation(summary = "Request account deletion OTP (Public)")
    @PostMapping("/delete-request")
    public ResponseEntity<ApiResponse<String>> requestDelete(
            @RequestParam String email,
            @RequestParam String password) {
        authService.requestDeleteAccount(email, password);
        return ResponseEntity.ok(ApiResponse.success("Account deletion OTP sent to your email", null));
    }

    @Tag(name = "User Account Management")
    @Operation(summary = "Verify OTP and PERMANENTLY delete account (Public)")
    @DeleteMapping("/delete-verify")
    public ResponseEntity<ApiResponse<String>> verifyDelete(
            @RequestParam String email,
            @RequestParam String otp) {
        authService.verifyDeleteAccount(email, otp);
        return ResponseEntity.ok(ApiResponse.success("Account permanently removed from FinFlow system", null));
    }

    @Tag(name = "User Profile Management")
    @Operation(summary = "Update user profile")
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<String>> updateProfile(
            @RequestHeader("applicantId") String userId,
            @RequestBody ProfileUpdateRequest request) {
        authService.updateProfile(UUID.fromString(userId), request.getFullName(), request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", null));
    }

    @Tag(name = "User Profile Management")
    @Operation(summary = "Initiate email update (Sends OTP to new email)")
    @PostMapping("/profile/email/initiate")
    public ResponseEntity<ApiResponse<String>> initiateEmailUpdate(
            @RequestHeader("applicantId") String userId,
            @RequestBody Map<String, String> request) {
        authService.initiateEmailUpdate(UUID.fromString(userId), request.get("newEmail"));
        return ResponseEntity.ok(ApiResponse.success("Verification code sent to your new email", null));
    }

    @Tag(name = "User Profile Management")
    @Operation(summary = "Confirm email update (Verifies OTP)")
    @PostMapping("/profile/email/confirm")
    public ResponseEntity<ApiResponse<String>> confirmEmailUpdate(
            @RequestHeader("applicantId") String userId,
            @RequestBody EmailUpdateRequest request) {
        authService.confirmEmailUpdate(UUID.fromString(userId), request.getOtp(), request.getNewEmail());
        return ResponseEntity.ok(ApiResponse.success("Email updated successfully", null));
    }

    @Tag(name = "User Profile Management")
    @Operation(summary = "Get recent login history")
    @GetMapping("/profile/login-history")
    public ResponseEntity<ApiResponse<List<com.finflow.auth.entity.UserLogin>>> getLoginHistory(
            @RequestHeader("applicantId") String userId) {
        List<com.finflow.auth.entity.UserLogin> history = authService.getLastLogins(UUID.fromString(userId));
        return ResponseEntity.ok(ApiResponse.success("Login history retrieved", history));
    }
}
