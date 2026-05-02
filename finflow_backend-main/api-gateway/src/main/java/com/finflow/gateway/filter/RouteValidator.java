package com.finflow.gateway.filter;

import org.springframework.stereotype.Component;
import org.springframework.http.server.reactive.ServerHttpRequest;





@Component
public class RouteValidator {

    private static final java.util.List<String> EXACT_PUBLIC_PATHS = java.util.List.of(
            "/api/auth/signup",
            "/api/auth/login",
            "/api/auth/login/verify",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/verify-otp",
            "/api/auth/reset-password",
            "/api/auth/delete-request",
            "/api/auth/delete-verify",
            "/swagger-ui.html",
            "/v3/api-docs"
    );

    private static final java.util.List<String> PUBLIC_PATH_PREFIXES = java.util.List.of(
            "/eureka",
            "/api/auth/signup/",
            "/api/auth/v3/api-docs",
            "/api/documents/v3/api-docs",
            "/api/applications/v3/api-docs",
            "/api/admin/v3/api-docs",
            "/api/documents/v3/api-docs",
            "/v3/api-docs/",
            "/swagger-ui/",
            "/webjars/"
    );

    public boolean isSecured(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        return EXACT_PUBLIC_PATHS.stream().noneMatch(path::equals)
                && PUBLIC_PATH_PREFIXES.stream().noneMatch(path::startsWith);
    }
}
