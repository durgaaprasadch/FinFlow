package com.finflow.notification.service;

import com.finflow.notification.dto.InAppNotification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * In-memory store for per-user in-app notifications.
 * Keyed by email address. Max 50 notifications kept per user (oldest dropped).
 */
@Service
@Slf4j
public class InAppNotificationStore {

    private static final int MAX_PER_USER = 50;
    private final Map<String, CopyOnWriteArrayList<InAppNotification>> store = new ConcurrentHashMap<>();

    public void add(String email, InAppNotification notification) {
        if (email == null || email.isBlank()) return;
        String key = email.toLowerCase().trim();
        CopyOnWriteArrayList<InAppNotification> list = store.computeIfAbsent(
                key, k -> new CopyOnWriteArrayList<>()
        );
        list.add(0, notification); // newest first
        if (list.size() > MAX_PER_USER) {
            list.remove(list.size() - 1);
        }
        log.info("[NOTIF-STORE] Added notification for {}. New count: {}", key, list.size());
    }

    public List<InAppNotification> get(String email) {
        if (email == null || email.isBlank()) return Collections.emptyList();
        String key = email.toLowerCase().trim();
        List<InAppNotification> list = new ArrayList<>(store.getOrDefault(key, new CopyOnWriteArrayList<>()));
        
        // Ensure newest first
        list.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        
        log.info("[NOTIF-STORE] Fetching {} notifications for user: {}", list.size(), key);
        return list;
    }

    public boolean markRead(String email, String notificationId) {
        List<InAppNotification> list = get(email);
        for (InAppNotification n : list) {
            if (n.getId().equals(notificationId)) {
                n.setRead(true);
                return true;
            }
        }
        return false;
    }

    public void markAllRead(String email) {
        get(email).forEach(n -> n.setRead(true));
    }
}
