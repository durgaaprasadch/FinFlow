package com.finflow.auth.service;

import com.finflow.auth.dto.LoginRequest;
import com.finflow.auth.dto.LoginResponse;
import com.finflow.auth.dto.SignupRequest;
import com.finflow.auth.entity.User;
import com.finflow.auth.entity.UserOtp;
import com.finflow.auth.repository.UserOtpRepository;
import com.finflow.auth.repository.UserRepository;
import com.finflow.auth.repository.UserLoginRepository;
import com.finflow.auth.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private UserOtpRepository otpRepository;
    
    @Mock
    private UserLoginRepository loginRepository;

    private AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, jwtService, rabbitTemplate, otpRepository, loginRepository);
        user = User.builder()
                .id(UUID.randomUUID())
                .fullName("Test User")
                .email("test@finflow.in")
                .password("encodedPassword")
                .role("ADMIN")
                .status("ACTIVE")
                .build();
    }

    @Test
    void signup_ShouldRegisterAdmin_WhenFinflowEmail() {
        SignupRequest request = SignupRequest.builder()
                .fullName("Admin User")
                .email("admin@finflow.in")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("admin@finflow.in")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        String result = authService.signup("ADMIN", request);

        assertTrue(result.contains("User registered successfully"));
        
        org.mockito.ArgumentCaptor<User> userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertEquals("ADMIN", savedUser.getRole());
        assertEquals("UNVERIFIED", savedUser.getStatus());
    }

    @Test
    void signup_ShouldRegisterApplicant_WhenRegularEmail() {
        SignupRequest request = SignupRequest.builder()
                .fullName("Regular User")
                .email("user@gmail.com")
                .password("password123")
                .build();

        when(userRepository.existsByEmail("user@gmail.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        User result = authService.registerUser("APPLICANT", request);

        assertNotNull(result);
        
        org.mockito.ArgumentCaptor<User> userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertEquals("APPLICANT", savedUser.getRole());
        assertEquals("UNVERIFIED", savedUser.getStatus());
    }

    @Test
    void login_ShouldReturnResponse_WhenValid() {
        LoginRequest request = new LoginRequest("test@finflow.in", "password123");

        when(userRepository.findByEmail("test@finflow.in")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtService.generateToken(anyString(), anyString(), any())).thenReturn("access-token");
        when(jwtService.generateRefreshToken(anyString())).thenReturn("refresh-token");

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertFalse(response.isMfaRequired());
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
    }

    @Test
    void signup_ShouldThrowException_WhenEmailExists() {
        SignupRequest request = SignupRequest.builder().email("test@finflow.in").build();
        when(userRepository.existsByEmail("test@finflow.in")).thenReturn(true);
        when(userRepository.findByEmail("test@finflow.in")).thenReturn(Optional.of(user));

        assertThrows(com.finflow.auth.exception.AuthException.class, () -> authService.registerUser("APPLICANT", request));
    }

    @Test
    void login_ShouldThrowException_WhenUserNotFound() {
        LoginRequest request = new LoginRequest("nonexistent@fail.com", "pass");
        when(userRepository.findByEmail("nonexistent@fail.com")).thenReturn(Optional.empty());

        assertThrows(com.finflow.auth.exception.AuthException.class, () -> authService.login(request));
    }

    @Test
    void login_ShouldThrowException_WhenPasswordMismatch() {
        LoginRequest request = new LoginRequest("test@finflow.in", "wrongpass");
        when(userRepository.findByEmail("test@finflow.in")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpass", "encodedPassword")).thenReturn(false);

        assertThrows(com.finflow.auth.exception.AuthException.class, () -> authService.login(request));
    }

    @Test
    void login_ShouldThrowException_WhenAccountNotActive() {
        user.setStatus("UNVERIFIED");
        LoginRequest request = new LoginRequest("test@finflow.in", "password123");
        when(userRepository.findByEmail("test@finflow.in")).thenReturn(Optional.of(user));

        assertThrows(com.finflow.auth.exception.AuthException.class, () -> authService.login(request));
    }

    @Test
    void registerUser_ShouldRefreshUnverifiedAccount_WhenSignupRepeated() {
        User pendingUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("Old Name")
                .email("user@gmail.com")
                .password("oldEncodedPassword")
                .phone("9000000000")
                .role("APPLICANT")
                .status("UNVERIFIED")
                .build();
        SignupRequest request = SignupRequest.builder()
                .fullName("New Name")
                .email("USER@gmail.com")
                .password("NewStrong@123")
                .phone("9876543210")
                .build();

        when(userRepository.existsByEmail("user@gmail.com")).thenReturn(true);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(pendingUser));
        when(passwordEncoder.encode("NewStrong@123")).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = authService.registerUser("APPLICANT", request);

        assertEquals(pendingUser.getId(), result.getId());
        assertEquals("New Name", result.getFullName());
        assertEquals("9876543210", result.getPhone());
        assertEquals("newEncodedPassword", result.getPassword());
        assertEquals("APPLICANT", result.getRole());
        assertEquals("UNVERIFIED", result.getStatus());
        verify(otpRepository).deleteByEmailAndPurpose("user@gmail.com", UserOtp.OtpPurpose.REGISTRATION);
        verify(otpRepository).save(any(UserOtp.class));
        verify(rabbitTemplate).convertAndSend(any(), any(), any(com.finflow.notification.dto.NotificationRequest.class));
    }
}
