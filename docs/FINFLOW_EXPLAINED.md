# 🎓 FinFlow Technical Masterclass: Architectural Breakdown

This document provides a comprehensive technical walkthrough of the design patterns, code structures, and microservice communications implemented within the FinFlow ecosystem.

---

## 🏗️ Part 1: Gateway Routing & Security Context Propagation

### 1. Edge Security Filter (API Gateway)
The `API Gateway` acts as a reverse proxy, checking and validating stateless JWT authorization credentials at the boundary. It intercepts incoming HTTP requests, validates the signature, extracts the user's role and identity claims, and forwards them as downstream request headers. This decouples individual microservices from identity verification.

**Downstream Header Propagation Logic (Conceptual):**
```java
// Located in: api-gateway/src/main/java/com/finflow/gateway/filter/AuthenticationFilter.java
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            if (isSecured(request)) {
                if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Auth Header");
                }

                String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    authHeader = authHeader.substring(7);
                }

                try {
                    // Validate JWT and extract claims
                    jwtUtil.validateToken(authHeader);
                    String role = jwtUtil.getClaim(authHeader, "role");
                    String userId = jwtUtil.getClaim(authHeader, "userId");

                    // Mutate request headers to propagate user context downstream
                    ServerHttpRequest mutatedRequest = request.mutate()
                        .header("userRole", role)
                        .header("applicantId", userId)
                        .header("loggedInUser", jwtUtil.getSubject(authHeader))
                        .build();

                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                } catch (Exception e) {
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Token credentials");
                }
            }
            return chain.filter(exchange);
        };
    }
}
```

---

## 🛡️ Part 2: Unified Resilience & Exception Governance

### 1. Global Exception Handlers (`@RestControllerAdvice`)
To satisfy the requirement of consistent API error payloads and avoid leaking raw Java stack traces, each microservice implements a centralized exception handler using `@RestControllerAdvice`.

**Unified Error Response Class:**
```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private int status;
    private String message;
    private String errorCode;
    private LocalDateTime timestamp;
}
```

**Global Exception Handler Controller:**
```java
// Located in: auth-service/src/main/java/com/finflow/auth/exception/GlobalExceptionHandler.java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuthException(AuthException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            ex.getMessage(),
            "AUTH_ERROR_01",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errorMsg = ex.getBindingResult().getFieldErrors().stream()
            .map(FieldError::getDefaultMessage)
            .collect(Collectors.joining(", "));
            
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation Failed: " + errorMsg,
            "VALIDATION_ERROR",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected system error occurred. Please contact admin.",
            "GENERIC_SYSTEM_ERROR",
            LocalDateTime.now()
        );
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

### 2. Resilience4j Circuit Breaker (Admin Service)
To prevent cascading failures across microservices, the `admin-service` utilizes a Resilience4j Circuit Breaker when invoking the `application-service` via a Feign Client. If the target service fails or times out, requests are short-circuited and routed to a fallback method.

**Feign Client Integration:**
```java
// Located in: admin-service/src/main/java/com/finflow/admin/service/AdminService.java
@Service
public class AdminService {

    @Autowired
    private ApplicationServiceClient appClient;

    @CircuitBreaker(name = "applicationService", fallbackMethod = "getApplicationFallback")
    public ApplicationSummaryDTO getApplicationDetails(Long id) {
        return appClient.getApplicationById(id);
    }

    // Fallback response invoked when the circuit is OPEN or application-service is down
    public ApplicationSummaryDTO getApplicationFallback(Long id, Throwable throwable) {
        ApplicationSummaryDTO fallbackDto = new ApplicationSummaryDTO();
        fallbackDto.setId(id);
        fallbackDto.setStatus("SERVICE_UNAVAILABLE");
        fallbackDto.setRemarks("Application service is currently down. Fallback details provided.");
        return fallbackDto;
    }
}
```

---

## ✉️ Part 3: Asynchronous Event-Driven Messaging (RabbitMQ)

To avoid blocking web threads with long-running tasks like sending SMTP emails, FinFlow uses an asynchronous messaging pipeline with RabbitMQ.

```
[Application/Auth Service] ---> (Publish JSON) ---> [RabbitMQ Exchange]
                                                           │
                                                           ▼
[Notification Service] <--- (Consume Event) <--- [RabbitMQ Queue]
```

### 1. Publishing Events (Application Service)
```java
// Located in: application-service/src/main/java/com/finflow/application/messaging/EventPublisher.java
@Component
public class EventPublisher {

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${spring.rabbitmq.exchange.notification}")
    private String exchange;

    @Value("${spring.rabbitmq.routing-keys.loan-status}")
    private String routingKey;

    public void publishLoanStatusEvent(LoanStatusMessage message) {
        // Automatically serializes object to JSON using Jackson2JsonMessageConverter
        rabbitTemplate.convertAndSend(exchange, routingKey, message);
    }
}
```

### 2. Consuming Events & Dispatching Email (Notification Service)
```java
// Located in: notification-service/src/main/java/com/finflow/notification/listener/NotificationListener.java
@Component
public class NotificationListener {

    @Autowired
    private EmailService emailService;

    @RabbitListener(queues = "${spring.rabbitmq.notification.queues.loan-status}")
    public void handleLoanStatusEvent(LoanStatusMessage message) {
        try {
            emailService.sendEmail(
                message.getRecipientEmail(),
                "FinFlow Loan Status Update - " + message.getApplicationId(),
                "loan-status-template",
                Map.of(
                    "name", message.getRecipientName(),
                    "status", message.getStatus(),
                    "amount", message.getAmount().toString()
                )
            );
        } catch (Exception e) {
            log.error("Failed to process email delivery task: ", e);
        }
    }
}
```

---

## 🎨 Part 4: Frontend Token Synchronization (Axios Interceptors)

Stateless JWT authentication requires token management in the client app. To ensure seamless session continuation, the React application uses an Axios response interceptor that automatically refreshes expired access tokens. It synchronizes multiple simultaneous requests during the refresh window to avoid logging the user out.

```javascript
// Located in: finflow-frontend/src/api/index.js
import axios from 'axios';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 10000,
});

// Response Interceptor: Catches 401 Unauthorized errors
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue subsequent requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('finflow_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Call backend token exchange endpoint
        const res = await axios.post(`${client.defaults.baseURL}/auth/refresh`, { refreshToken });
        if (res.status === 200) {
          const newToken = res.data.accessToken;
          localStorage.setItem('finflow_token', newToken);
          client.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken); // Resolve queued requests
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest); // Retry original request
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default client;
```

---

## 💡 Summary Cheat Sheet for Project Evaluation

If asked about the **Enterprise Design Patterns** in your project:
- **Core Microservices Architecture**: Decoupled, single-responsibility services. Independent scalability and fault boundaries.
- **Service Discovery**: Eureka allows dynamic service routing, eliminating hardcoded host names.
- **Configuration Server**: Configurations are managed outside code and loaded dynamically at boot time.
- **Circuit Breaker Pattern**: Isolates service failures and provides functional fallbacks.
- **Database-per-Service**: Strong data isolation. Relational dependencies are mapped logically using ID-referencing instead of schema constraints.
- **Asynchronous Messaging Broker**: RabbitMQ processes non-blocking long-running tasks.
- **Stateless Authentication**: Gateway manages token validation, downstream services consume stateless identity headers.
- **Global Error Interception**: Centralized `@RestControllerAdvice` maps exceptions to clean, structured error responses.
