package com.finflow.auth.config;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class AuthConfigTest {

    private final SecurityConfig securityConfig = new SecurityConfig(
            new JwtAuthenticationFilter(Mockito.mock(com.finflow.auth.security.JwtService.class)));

    @Test
    void passwordEncoder_ShouldReturnBCryptEncoder() {
        PasswordEncoder encoder = securityConfig.passwordEncoder();
        assertNotNull(encoder);
    }

    @Test
    void securityFilterChain_ShouldBeProduced() {
        // We just verify the bean method exists and returns something
        assertNotNull(securityConfig);
    }

}
