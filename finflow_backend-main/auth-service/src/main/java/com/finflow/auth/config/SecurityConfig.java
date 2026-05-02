package com.finflow.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
                this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                return http
                                .csrf(AbstractHttpConfigurer::disable)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/auth/signup/**",
                                                                "/api/auth/login",
                                                                "/api/auth/login/verify",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/verify-otp",
                                                                "/api/auth/reset-password",
                                                                "/api/auth/delete-request",
                                                                "/api/auth/delete-verify",
                                                                "/api/auth/refresh")
                                                .permitAll()
                                                // Internal service-to-service endpoints — protected at gateway (ADMIN
                                                // only),
                                                // so no JWT is available in inter-service calls. PermitAll here; rely
                                                // on gateway RBAC.
                                                .requestMatchers("/api/auth/internal/**").permitAll()
                                                .requestMatchers(
                                                                "/v3/api-docs",
                                                                "/v3/api-docs/**",
                                                                "/api/auth/v3/api-docs",
                                                                "/api/auth/v3/api-docs",
                                                                "/swagger-ui/**",
                                                                "/swagger-ui.html")
                                                .permitAll()
                                                .requestMatchers("/api/auth/admin/approve/**").hasAuthority("ADMIN")
                                                .requestMatchers("/error").permitAll()
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                                .build();
        }
}
