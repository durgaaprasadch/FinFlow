package com.finflow.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RouteValidatorTest {

    private RouteValidator routeValidator;

    @BeforeEach
    void setUp() {
        routeValidator = new RouteValidator();
    }

    @Test
    void isSecured_ShouldReturnFalse_ForOpenEndpoints() {
        ServerHttpRequest signupRequest = MockServerHttpRequest.get("/api/auth/signup").build();
        ServerHttpRequest loginRequest = MockServerHttpRequest.get("/api/auth/login").build();
        ServerHttpRequest eurekaRequest = MockServerHttpRequest.get("/eureka/apps").build();

        assertFalse(routeValidator.isSecured(signupRequest));
        assertFalse(routeValidator.isSecured(loginRequest));
        assertFalse(routeValidator.isSecured(eurekaRequest));
    }

    @Test
    void isSecured_ShouldReturnTrue_ForApiEndpoints() {
        ServerHttpRequest applicationRequest = MockServerHttpRequest.get("/api/applications/1").build();
        ServerHttpRequest documentRequest = MockServerHttpRequest.post("/api/documents/upload-all/1").build();
        ServerHttpRequest adminRequest = MockServerHttpRequest.get("/api/admin/applications/all").build();
        ServerHttpRequest deceptiveRequest = MockServerHttpRequest.get("/api/applications/api/auth/login/audit").build();

        assertTrue(routeValidator.isSecured(applicationRequest));
        assertTrue(routeValidator.isSecured(documentRequest));
        assertTrue(routeValidator.isSecured(adminRequest));
        assertTrue(routeValidator.isSecured(deceptiveRequest));
    }

    @Test
    void isSecured_ShouldReturnFalse_ForSwaggerEndpoints() {
        ServerHttpRequest swaggerUi = MockServerHttpRequest.get("/swagger-ui.html").build();
        ServerHttpRequest apiDocs = MockServerHttpRequest.get("/v3/api-docs").build();
        ServerHttpRequest serviceDocs = MockServerHttpRequest.get("/api/auth/v3/api-docs").build();
        ServerHttpRequest webjars = MockServerHttpRequest.get("/webjars/some-file").build();

        assertFalse(routeValidator.isSecured(swaggerUi));
        assertFalse(routeValidator.isSecured(apiDocs));
        assertFalse(routeValidator.isSecured(serviceDocs));
        assertFalse(routeValidator.isSecured(webjars));
    }
}
