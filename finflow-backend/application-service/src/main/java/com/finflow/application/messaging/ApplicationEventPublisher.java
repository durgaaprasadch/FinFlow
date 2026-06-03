package com.finflow.application.messaging;

import com.finflow.application.entity.LoanApplication;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ApplicationEventPublisher {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ApplicationEventPublisher.class);

    private final org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate;
    private final org.springframework.web.client.RestTemplate restTemplate;
    private final String exchange;
    private final String routingKey;
    private final String notificationExchange;
    private final String loanStatusRoutingKey;

    public ApplicationEventPublisher(
            org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate,
            org.springframework.web.client.RestTemplate restTemplate,
            @Value("${rabbitmq.exchange}") String exchange,
            @Value("${rabbitmq.routing.key.submitted}") String routingKey,
            @Value("${spring.rabbitmq.notification.exchanges.notification}") String notificationExchange,
            @Value("${spring.rabbitmq.notification.routing-keys.loan-status}") String loanStatusRoutingKey) {
        this.rabbitTemplate = rabbitTemplate;
        this.restTemplate = restTemplate;
        this.exchange = exchange;
        this.routingKey = routingKey;
        this.notificationExchange = notificationExchange;
        this.loanStatusRoutingKey = loanStatusRoutingKey;
    }

    private static final String AUTH_INTERNAL_ACTIVE_URL = "http://auth-service/api/auth/internal/users/active";

    public void publishApplicationSubmittedEvent(LoanApplication application) {
        // Core Event for processing
        rabbitTemplate.convertAndSend(exchange, routingKey, application);
        if (log.isInfoEnabled()) {
            log.info("Published APPLICATION_SUBMITTED event for Application ID: {}", application.getId());
        }

        // Notification to User: "Submitted"
        publishStatusUpdateNotification(application);

        // Alert to Admin: "New Application"
        publishAdminAlert(application);
    }

    public void publishAdminAlert(LoanApplication application) {
        try {
            java.util.List<String> adminEmails = fetchActiveAdminEmails();

            // If no active admins found, use fallback
            if (adminEmails.isEmpty()) {
                adminEmails = java.util.List.of("durgaprasadch.in@gmail.com");
            }

            String status = application.getStatus().toString();
            String subject = "ACTION REQUIRED: Loan Application Update (" + status + ")";
            String message = "Application APP-" + application.getId() + " by " + 
                             (application.getFullName() != null ? application.getFullName() : "Applicant") + 
                             " has updated status to: " + status;

            if ("DOCUMENTS_COMPLETED".equalsIgnoreCase(status)) {
                subject = "ACTION REQUIRED: Documents Re-uploaded - APP-" + application.getId();
                message = "Applicant " + application.getFullName() + " has completed the requested document re-uploads. Please review and verify.";
            }

            for (String email : adminEmails) {
                com.finflow.notification.dto.NotificationRequest alert = com.finflow.notification.dto.NotificationRequest
                        .builder()
                        .to(email)
                        .subject(subject)
                        .templateName("admin-alert-template")
                        .model(java.util.Map.of(
                                "applicationId", "APP-" + application.getId(),
                                "status", status,
                                "message", message,
                                "timestamp", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))))
                        .build();
                rabbitTemplate.convertAndSend(notificationExchange, loanStatusRoutingKey, alert);
                if (log.isInfoEnabled()) {
                    log.info("Published Admin Alert to {} for status {}: {}", email, status, application.getId());
                }
            }
        } catch (Exception e) {
            if (log.isErrorEnabled()) {
                log.error("Failed to notify admins of application update {}", application.getId(), e);
            }
        }
    }

    @SuppressWarnings("unchecked")
    private java.util.List<String> fetchActiveAdminEmails() {
        try {
            java.util.List<Object> adminUsers = restTemplate.getForObject(AUTH_INTERNAL_ACTIVE_URL, java.util.List.class);
            if (adminUsers == null)
                return java.util.Collections.emptyList();

            return adminUsers.stream()
                    .filter(java.util.Map.class::isInstance)
                    .map(obj -> (java.util.Map<String, Object>) obj)
                    .map(map -> (String) map.get("email"))
                    .filter(java.util.Objects::nonNull)
                    .toList();
        } catch (Exception e) {
            if (log.isWarnEnabled()) {
                log.warn("Could not fetch active admins from auth-service (URL: {}): {}", AUTH_INTERNAL_ACTIVE_URL,
                        e.getMessage());
            }
            return java.util.Collections.emptyList();
        }
    }

    public void publishStatusUpdateNotification(LoanApplication application) {
        try {
            String status = application.getStatus() != null ? application.getStatus().toString() : "UPDATED";
            String subject = "FinFlow: Loan Application Update (" + status + ")";
            
            // Premium Subject lines
            if ("APPROVED".equalsIgnoreCase(status)) subject = "CONGRATULATIONS: Your FinFlow Loan is Approved! 🎉";
            else if ("REJECTED".equalsIgnoreCase(status)) subject = "FinFlow Application Status: Update on APP-" + application.getId();
            else if ("REUPLOAD".equalsIgnoreCase(status)) subject = "ACTION REQUIRED: Document Re-upload for FinFlow Application";
            else if ("SUBMITTED".equalsIgnoreCase(status)) subject = "FinFlow: Application Received (APP-" + application.getId() + ")";

            com.finflow.notification.dto.NotificationRequest notification = com.finflow.notification.dto.NotificationRequest
                    .builder()
                    .to(application.getApplicantUsername())
                    .subject(subject)
                    .templateName("loan-status-template")
                    .model(java.util.Map.of(
                            "name", application.getFullName() != null ? application.getFullName() : "Valued Customer",
                            "applicationId", "APP-" + application.getId(),
                            "status", status,
                            "message", "Your loan application status has been updated. Please log in to your dashboard for more details.",
                            "timestamp", java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))))
                    .build();

            publishStatusUpdateNotificationDirectly(notification);
            if (log.isInfoEnabled()) {
                log.info("Published notification event for Application Status Change: {} -> {}", application.getId(),
                        status);
            }
        } catch (Exception e) {
            if (log.isErrorEnabled()) {
                log.error("Failed to publish status update notification for application {}", application.getId(), e);
            }
        }
    }

    public void publishStatusUpdateNotificationDirectly(com.finflow.notification.dto.NotificationRequest request) {
        try {
            rabbitTemplate.convertAndSend(notificationExchange, loanStatusRoutingKey, request);
            log.info("Directly published notification to user: {}", request.getTo());
        } catch (Exception e) {
            log.error("Failed to directly publish notification: {}", e.getMessage());
        }
    }
}
