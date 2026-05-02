package com.finflow.application.controller;

import com.finflow.application.entity.Notification;
import com.finflow.application.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository repository;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(@RequestHeader("applicantId") String userId) {
        return ResponseEntity.ok(repository.findAllByUserIdOrderByCreatedAtDesc(UUID.fromString(userId)));
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(@PathVariable long id) {
        repository.findById(id).ifPresent(n -> {
            n.setRead(true);
            repository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PostMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(@RequestHeader("applicantId") String userId) {
        repository.markAllAsReadForUser(UUID.fromString(userId));
        return ResponseEntity.ok().build();
    }
}
