package com.finflow.auth.messaging;

import com.finflow.notification.dto.NotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${spring.rabbitmq.notification.exchanges.notification:notification-exchange}")
    private String notificationExchange;

    @Value("${spring.rabbitmq.notification.routing-keys.registration:notification.registration}")
    private String registrationRoutingKey;

    @Value("${spring.rabbitmq.notification.routing-keys.login:notification.login}")
    private String loginRoutingKey;

    public void publishRegistrationEvent(String email, String name) {
        NotificationRequest request = NotificationRequest.builder()
                .to(email)
                .subject("Welcome to FinFlow")
                .model(Map.of("name", name != null ? name : "Valued Customer"))
                .build();
        rabbitTemplate.convertAndSend(notificationExchange, registrationRoutingKey, request);
        log.info("Published registration event for: {}", email);
    }

    public void publishLoginEvent(String email) {
        NotificationRequest request = NotificationRequest.builder()
                .to(email)
                .subject("Security Alert: New Login")
                .model(Map.of("email", email))
                .build();
        rabbitTemplate.convertAndSend(notificationExchange, loginRoutingKey, request);
        log.info("Published login event for: {}", email);
    }
}
