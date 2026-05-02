package com.finflow.notification.listener;

import com.finflow.notification.dto.InAppNotification;
import com.finflow.notification.dto.NotificationRequest;
import com.finflow.notification.service.EmailService;
import com.finflow.notification.service.InAppNotificationStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationListener {

    private final EmailService emailService;
    private final InAppNotificationStore inAppStore;

    @RabbitListener(queues = "${notification.queues.registration}")
    public void handleRegistrationNotification(NotificationRequest request) {
        log.info("RABBITMQ: Received REGISTRATION notification for: {}", request.getTo());
        if (request.getTemplateName() == null || request.getTemplateName().isEmpty()) {
            request.setTemplateName("registration-template");
        }
        emailService.sendEmail(request);

        String name = extractName(request);
        inAppStore.add(request.getTo(), InAppNotification.create(
                request.getTo(),
                "Welcome to FinFlow 🎉",
                "Your account has been created successfully" + (name != null ? ", " + name : "") + ". Start your loan application today.",
                "REGISTRATION"
        ));
    }

    @RabbitListener(queues = "${notification.queues.loan-status}")
    public void handleLoanStatusNotification(NotificationRequest request) {
        log.info("RABBITMQ: Received LOAN_STATUS notification for: {}", request.getTo());
        if (request.getTemplateName() == null || request.getTemplateName().isEmpty()) {
            request.setTemplateName("loan-status-template");
        }
        emailService.sendEmail(request);

        String status = extractModelValue(request, "status", "updated");
        String amount = extractModelValue(request, "amount", "");
        String body = buildLoanStatusMessage(status, amount);

        inAppStore.add(request.getTo(), InAppNotification.create(
                request.getTo(),
                "Application " + capitalise(status),
                body,
                "LOAN_STATUS"
        ));
    }

    @RabbitListener(queues = "${notification.queues.login}")
    public void handleLoginNotification(NotificationRequest request) {
        log.info("RABBITMQ: Received LOGIN notification for: {}", request.getTo());
        if (request.getTemplateName() == null || request.getTemplateName().isEmpty()) {
            request.setTemplateName("login-template");
        }
        emailService.sendEmail(request);

        inAppStore.add(request.getTo(), InAppNotification.create(
                request.getTo(),
                "New Sign-In Detected",
                "A successful login was recorded on your account. If this wasn't you, contact support immediately.",
                "LOGIN"
        ));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private String extractName(NotificationRequest request) {
        if (request.getModel() == null) return null;
        Object v = request.getModel().get("name");
        return v != null ? v.toString() : null;
    }

    private String extractModelValue(NotificationRequest request, String key, String fallback) {
        if (request.getModel() == null) return fallback;
        Object v = request.getModel().get(key);
        return v != null ? v.toString() : fallback;
    }

    private String buildLoanStatusMessage(String status, String amount) {
        String upper = status.toUpperCase();
        String amtPart = (amount != null && !amount.isBlank()) ? " for ₹" + amount : "";
        return switch (upper) {
            case "PERSONAL_DETAILS_ADDED"   -> "Protocol Step 1: Personal details have been securely saved.";
            case "EMPLOYMENT_DETAILS_ADDED" -> "Protocol Step 2: Employment profile has been updated.";
            case "LOAN_DETAILS_ADDED"       -> "Protocol Step 3: Loan configuration" + amtPart + " is complete.";
            case "DOCUMENTS_COMPLETED"      -> "Protocol Update: All mandatory documents are now verified and ready.";
            case "SUBMITTED"                -> "Final Protocol: Your application" + amtPart + " has been officially submitted for review.";
            case "APPROVED"                 -> "Great news! Your loan application" + amtPart + " has been approved.";
            case "REJECTED"                 -> "Your loan application" + amtPart + " was not approved at this time.";
            case "DOCS_VERIFIED"            -> "Your documents have been verified. Your application is now under review.";
            case "REVIEW"                   -> "Your application is now under underwriting review.";
            case "REUPLOAD"                 -> "Action required: Some documents need to be re-uploaded.";
            default                         -> "Protocol Alert: Your loan application status has been updated to " + capitalise(status) + ".";
        };
    }

    private String capitalise(String s) {
        if (s == null || s.isBlank()) return s;
        String lower = s.toLowerCase().replace("_", " ");
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
