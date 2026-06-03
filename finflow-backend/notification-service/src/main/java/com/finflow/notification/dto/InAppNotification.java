package com.finflow.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InAppNotification {
    private String id;
    private String recipientEmail;
    private String title;
    private String message;
    private String type; // LOAN_STATUS, LOGIN, REGISTRATION
    private boolean read;
    private Instant createdAt;

    public static InAppNotification create(String email, String title, String message, String type) {
        return InAppNotification.builder()
                .id(UUID.randomUUID().toString())
                .recipientEmail(email)
                .title(title)
                .message(message)
                .type(type)
                .read(false)
                .createdAt(Instant.now())
                .build();
    }
}
