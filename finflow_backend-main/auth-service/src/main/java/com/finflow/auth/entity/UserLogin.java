package com.finflow.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_logins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLogin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private UUID userId;

    private LocalDateTime loginTime;
    
    private String ipAddress;
    
    private String userAgent;

    @PrePersist
    protected void onCreate() {
        loginTime = LocalDateTime.now();
    }
}
