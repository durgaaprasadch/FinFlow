package com.finflow.auth.config;

import com.finflow.auth.entity.User;
import com.finflow.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        seedTestUser();
    }

    @SuppressWarnings("null")
    private void seedTestUser() {
        String testEmail = "test@finflow.in";
        if (userRepository.findByEmail(testEmail).isEmpty()) {
            User testUser = User.builder()
                    .fullName("TestUser")
                    .email(testEmail)
                    .password(passwordEncoder.encode("Test@123"))
                    .role("APPLICANT")
                    .status("ACTIVE")
                    .build();
            userRepository.save(testUser);
            log.info("SEED: Test user created successfully: {}", testEmail);
        } else {
            log.info("SEED: Test user already exists: {}", testEmail);
        }

        String adminEmail = "admin@finflow.in";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User adminUser = User.builder()
                    .fullName("TestAdmin")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@123"))
                    .role("ADMIN")
                    .status("ACTIVE")
                    .build();
            userRepository.save(adminUser);
            log.info("SEED: Test admin created successfully: {}", adminEmail);
        } else {
            log.info("SEED: Test admin already exists: {}", adminEmail);
        }
    }
}
