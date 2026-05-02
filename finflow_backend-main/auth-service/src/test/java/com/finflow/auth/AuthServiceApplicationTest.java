package com.finflow.auth;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.cloud.config.enabled=false",
    "eureka.client.enabled=false",
    "spring.config.import=",
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration",
    "jwt.secret=5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437"
})
class AuthServiceApplicationTest {

    @org.springframework.beans.factory.annotation.Autowired
    private ApplicationContext context;

    @Test
    void contextLoads() {
        assertNotNull(context, "Application context should not be null");
    }

    @Test
    void main_ShouldStartApplication() {
        assertDoesNotThrow(() -> AuthServiceApplication.main(new String[]{
            "--server.port=0",
            "--spring.profiles.active=test",
            "--spring.cloud.config.enabled=false",
            "--eureka.client.enabled=false",
            "--spring.config.import=",
            "--spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.amqp.RabbitAutoConfiguration"
        }));
    }
}
