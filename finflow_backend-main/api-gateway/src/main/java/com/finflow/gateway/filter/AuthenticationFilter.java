package com.finflow.gateway.filter;

import com.finflow.gateway.util.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.http.server.reactive.ServerHttpRequest;
import reactor.core.publisher.Mono;

@Component
@Slf4j
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    private final RouteValidator validator;
    private final JwtUtil jwtUtil;

    public AuthenticationFilter(RouteValidator validator, JwtUtil jwtUtil) {
        super(Config.class);
        this.validator = validator;
        this.jwtUtil = jwtUtil;
    }

    private static final String LOGIN_USER_HEADER = "loggedInUser";
    private static final String USER_ROLE_HEADER = "userRole";
    private static final String APPLICANT_ID_HEADER = "applicantId";

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            log.info("[GATEWAY] Incoming Request: {} | Method: {}", path, request.getMethod());

            // 1. Check if the path is marked as public in RouteValidator
            if (!validator.isSecured(request) || isOptionsRequest(request)) {
                return chain.filter(exchange);
            }

            // 2. Secured Path: Validate Authorization Header
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || authHeader.isEmpty()) {
                return onError(exchange, "Missing authorization header", HttpStatus.UNAUTHORIZED);
            }

            return handleSecuredRequest(exchange, chain, path, authHeader);
        };
    }

    private Mono<Void> handleSecuredRequest(ServerWebExchange exchange, GatewayFilterChain chain, String path, String authHeader) {
        String token = extractToken(authHeader);
        try {
            jwtUtil.validateToken(token);
            String username = jwtUtil.extractUsername(token);
            String rawRole = jwtUtil.extractRole(token);
            // Normalize: strip ROLE_ prefix so all downstream services get plain APPLICANT / ADMIN
            String role = rawRole != null && rawRole.toUpperCase().startsWith("ROLE_")
                    ? rawRole.substring(5)
                    : rawRole;
            String userId = jwtUtil.extractUserId(token);

            // 3. RBAC Check: Restrict specific paths to ADMIN only
            if (isAdminRestricted(path, role)) {
                log.warn("[GATEWAY] RBAC Violation: User {} with role {} tried to access {}", username, role, path);
                return onError(exchange, "Forbidden: Administrative access only", HttpStatus.FORBIDDEN);
            }

            if (path.contains("/notifications")) {
                log.info("[GATEWAY-AUTH] Identified user for notifications: {} (Role: {})", username, role);
            }

            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header(LOGIN_USER_HEADER, username)
                    .header(USER_ROLE_HEADER, role)
                    .header(APPLICANT_ID_HEADER, userId == null ? "" : userId)
                    .build();
            return chain.filter(exchange.mutate().request(mutatedRequest).build());

        } catch (Exception e) {
            log.error("[GATEWAY] Token validation failed for path {}: {}", path, e.getMessage());
            return onError(exchange, "Unauthorized access: Invalid or expired token", HttpStatus.UNAUTHORIZED);
        }
    }


    private boolean isOptionsRequest(ServerHttpRequest request) {
        return request.getMethod() == org.springframework.http.HttpMethod.OPTIONS;
    }

    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return authHeader;
    }

    private boolean isAdminRestricted(String path, String role) {
        // Paths that MUST be ADMIN only
        boolean isAdminOnlyPath = path.startsWith("/api/admin") 
                || path.startsWith("/api/auth/internal")
                || path.equals("/api/applications/all");
                
        boolean isAuthorized = "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);
        return isAdminOnlyPath && !isAuthorized;
    }

    // [ERROR] ERROR HANDLER
    @SuppressWarnings("null")
    private Mono<Void> onError(ServerWebExchange exchange, String errMessage, HttpStatus status) {
        org.springframework.http.server.reactive.ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, "application/json");

        String path = exchange.getRequest().getURI().getPath();
        String jsonError = String.format("{%n  \"timestamp\": \"%s\",%n  \"status\": %d,%n  \"error\": \"%s\",%n  \"message\": \"%s\",%n  \"path\": \"%s\"%n}",
                java.time.Instant.now().toString(), status.value(), status.getReasonPhrase(), errMessage, path);

        org.springframework.core.io.buffer.DataBuffer buffer = response.bufferFactory().wrap(jsonError.getBytes());
        return response.writeWith(Mono.just(buffer));
    }

    /**
     * Configuration interface for AuthenticationFilter.
     */
    public static class Config {
        private String name = "default";
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }
}
