package com.finflow.auth.controller;

import com.finflow.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/internal")
@Hidden
public class InternalAdminController {

    private final AuthService authService;

    public InternalAdminController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping("/users/{userId}/status")
    public void updateUserStatus(@PathVariable String userId, @RequestParam String status) {
        authService.updateUserStatus(userId, status);
    }

    @GetMapping("/users/active")
    public Object getActiveAdmins() {
        return authService.getActiveAdminUsers();
    }

    @GetMapping("/users/all")
    public Object getAllAdmins() {
        return authService.getAllAdminUsers();
    }

    @GetMapping("/users/everybody")
    public Object getAllUsers() {
        return authService.getAllUsers();
    }

    @PostMapping("/users/promote")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void promoteUser(@RequestBody java.util.Map<String, String> request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String targetEmail = request.get("email");
        String adminEmail = httpRequest.getHeader("loggedInUser");

        System.out.println("AUDIT_LOG: CRITICAL_ACTION - User promotion initiated by " + adminEmail + " for target: "
                + targetEmail);

        authService.promoteToAdmin(targetEmail);

        System.out.println("AUDIT_LOG: SUCCESS - User " + targetEmail + " promoted to ADMIN by " + adminEmail);
    }

    @PostMapping("/users/demote")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public void demoteUser(@RequestBody java.util.Map<String, String> request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String targetEmail = request.get("email");
        String adminEmail = httpRequest.getHeader("loggedInUser");

        System.out.println("AUDIT_LOG: CRITICAL_ACTION - User demotion initiated by " + adminEmail + " for target: "
                + targetEmail);

        authService.demoteToUser(targetEmail);

        System.out.println("AUDIT_LOG: SUCCESS - User " + targetEmail + " demoted to APPLICANT by " + adminEmail);
    }
}
