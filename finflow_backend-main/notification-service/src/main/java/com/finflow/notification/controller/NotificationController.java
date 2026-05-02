package com.finflow.notification.controller;

import com.finflow.notification.dto.InAppNotification;
import com.finflow.notification.dto.NotificationRequest;
import com.finflow.notification.service.EmailService;
import com.finflow.notification.service.InAppNotificationStore;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST API for in-app notifications.
 * The caller's email is resolved from the loggedInUser header set by the API Gateway.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final InAppNotificationStore store;
    private final EmailService emailService;

    /** POST /api/notifications/send — bypass RabbitMQ and send directly */
    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendEmailDirectly(@RequestBody NotificationRequest request) {
        log.info("[NOTIF-API] Direct email request received for: '{}'", request.getTo());
        emailService.sendEmail(request);
        return ResponseEntity.ok(Map.of("status", "SENT"));
    }

    /** GET /api/notifications — fetch all for the logged-in user */
    @GetMapping
    public ResponseEntity<List<InAppNotification>> getNotifications(HttpServletRequest request) {
        String email = resolveEmail(request);
        log.info("[NOTIF-API] Fetching notifications for email: '{}'", email);
        List<InAppNotification> list = store.get(email);
        
        // Diagnostic: If empty, add a dummy to see if UI can at least talk to backend
        if (list.isEmpty()) {
            return ResponseEntity.ok(List.of(InAppNotification.create(
                "system@finflow.in",
                "System Update Check",
                "Connection verified. Identity resolved as: '" + email + "'.",
                "SYSTEM"
            )));
        }
        
        return ResponseEntity.ok(list);
    }

    /** PATCH /api/notifications/{id}/read — mark one as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Map<String, Object>> markRead(
            @PathVariable String id,
            HttpServletRequest request) {
        String email = resolveEmail(request);
        boolean found = store.markRead(email, id);
        return ResponseEntity.ok(Map.of("success", found, "id", id));
    }

    /** POST /api/notifications/read-all — mark all as read */
    @PostMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllRead(HttpServletRequest request) {
        String email = resolveEmail(request);
        store.markAllRead(email);
        return ResponseEntity.ok(Map.of("status", "OK"));
    }

    private String resolveEmail(HttpServletRequest request) {
        String email = request.getHeader("loggedInUser");
        return email != null ? email : "";
    }
}
