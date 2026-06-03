# 🎓 FinFlow Technical Masterclass: Detailed Code Walkthrough

This document provides a detailed technical analysis of the design patterns, code configurations, and microservice communications used within the FinFlow ecosystem.

---

## 🏗️ 1. API Gateway Routing & Context Propagation

The **API Gateway** acts as the single edge boundary. It intercepts all incoming requests, validates stateless JWT credentials, and propagates security context downstream.

### **Gateway Filter Logic**
The gateway runs an `AuthenticationFilter` that validates the token, extracts the claims, and propagates them as headers:

```java
// Logic snippet inside gateway filter
ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
    .header("userRole", extractedRole)       // Propagates role (e.g. ROLE_APPLICANT)
    .header("applicantId", extractedUserId)   // Propagates user/applicant ID
    .header("loggedInUser", extractedUsername) // Propagates email username
    .build();
return chain.filter(exchange.mutate().request(mutatedRequest).build());
```

---

## 🛡️ 2. Global Exception Handling & Circuit Breakers

### **Global Exception Handler Pattern**
Each microservice governs exceptions centrally using Spring Boot's `@RestControllerAdvice`. This returns consistent JSON error payloads instead of exposing system-level details or compiler stack traces.

**Unified Error Response JSON Format:**
```json
{
  "status": 401,
  "message": "Invalid credentials or token expired",
  "errorCode": "AUTH_ERROR_01",
  "timestamp": "2026-06-03T18:00:00"
}
```

**Controller Advice Class Structure:**
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthException ex) {
        ErrorResponse err = new ErrorResponse(401, ex.getMessage(), "AUTH_EX", LocalDateTime.now());
        return new ResponseEntity<>(err, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().get(0).getDefaultMessage();
        ErrorResponse err = new ErrorResponse(400, "Validation Failed: " + msg, "VAL_EX", LocalDateTime.now());
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }
}
```

### **Circuit Breaker (Resilience4j)**
The `admin-service` calls the `application-service` via a Feign Client. To prevent failure cascade if the application-service is down:
* **Circuit Breaker Configuration (`application.yml`):**
  ```yaml
  resilience4j.circuitbreaker:
    instances:
      applicationService:
        slidingWindowSize: 5
        minimumNumberOfCalls: 3
        waitDurationInOpenState: 5000ms
        failureRateThreshold: 50
  ```
* **Fallback Implementation:**
  ```java
  @CircuitBreaker(name = "applicationService", fallbackMethod = "getApplicationFallback")
  public ApplicationSummaryDTO getApplicationDetails(Long id) {
      return appClient.getApplicationById(id);
  }
  
  public ApplicationSummaryDTO getApplicationFallback(Long id, Throwable t) {
      // Return placeholder DTO when the target service is unavailable
      return new ApplicationSummaryDTO(id, "SERVICE_UNAVAILABLE", "Service down");
  }
  ```

---

## ✉️ 3. Asynchronous Messaging Broker (RabbitMQ)

To ensure the client request thread does not block during slow email deliveries, notifications are processed asynchronously using **RabbitMQ**.

### **Event Publisher (Application Service)**
```java
@Component
public class EventPublisher {
    @Autowired
    private RabbitTemplate rabbitTemplate;

    public void publishLoanStatusEvent(LoanStatusMessage message) {
        // Publishes event to RabbitMQ topic exchange
        rabbitTemplate.convertAndSend("loan.exchange", "notification.loan-status", message);
    }
}
```

### **Event Listener (Notification Service)**
```java
@Component
public class NotificationListener {
    @Autowired
    private EmailService emailService;

    @RabbitListener(queues = "loan-status-queue")
    public void handleEvent(LoanStatusMessage message) {
        // Consumes message asynchronously and sends template-based email
        emailService.sendEmail(message.getEmail(), "Status Update", "status-template", message.getModel());
    }
}
```

---

## 🎨 4. Frontend Token Refresh Interceptor (Axios)

The React client app synchronizes access token refresh calls using an Axios interceptor:

```javascript
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue concurrent requests during the active refresh call
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post('/auth/refresh', { refreshToken });
        const newToken = res.data.accessToken;
        localStorage.setItem('finflow_token', newToken);
        processQueue(null, newToken);
        return client(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 💡 Viva Q&A Technical Summary

* **Q: Why Database-per-Service?**
  * A: It ensures absolute database schema isolation. If one service database crashes or undergoes schema changes, other services remain operational. Relationships are managed logically via reference IDs.
* **Q: How does the Gateway communicate identity downstream?**
  * A: The API Gateway validates the JWT, strips the signature, and passes critical claims as HTTP headers (`userRole`, `applicantId`, `loggedInUser`) to down-stream services.
* **Q: What is the benefit of a Circuit Breaker?**
  * A: It blocks cascading timeouts. If a service becomes unhealthy, the gateway or calling service immediately routes to fallback methods instead of hanging threads.
