# 🎓 FinFlow Technical Masterclass: The Core Architecture

This document provides a conceptual walkthrough of the design patterns, architectural decisions, and integration flows implemented across the FinFlow microservices ecosystem.

---

## 🏗️ 1. API Gateway Routing & Security Context

### **The Architecture**
The **API Gateway** acts as the single secure entry point. It intercepts all incoming requests from the frontend and performs edge validation.
- **JWT Verification**: Validates token signature and expiration.
- **Header Propagation**: Once validated, the Gateway extracts claims (such as `userRole`, `applicantId`, and `loggedInUser`) and injects them as request headers before routing downstream.
- **Benefit**: Individual microservices do not need to repeat JWT signature checks; they simply read the trusted downstream headers.

---

## 🛡️ 2. Global Exception Handling & Circuit Breakers

### **Unified Error Response**
To satisfy strict API standards and prevent raw Java stack traces from leaking to the frontend, each microservice implements a centralized error advisor:
- **`@RestControllerAdvice`**: Global interceptor catches service exceptions (like `AuthException` or `DocumentException`).
- **Consistent Response**: Standardized JSON body containing `status`, `message`, `errorCode`, and `timestamp`.

### **Resilience & Fault Tolerance**
To avoid cascading failures (e.g., if the Admin Service calls the Application Service and it times out):
- **Resilience4j Circuit Breaker**: Wraps inter-service calls.
- **Fallback Method**: If the target service fails or is slow, the Circuit Breaker trips, and a fallback response (e.g. returning cached or placeholder details) is returned immediately to prevent hanging threads.

---

## ✉️ 3. Asynchronous Messaging (RabbitMQ)

To keep the application responsive, heavy tasks (like sending transactional registration or status emails) are decoupled from the main request thread using **RabbitMQ**.

### **Event Flow**
1. **Publish Event**: When a loan status changes, the originating microservice publishes a JSON event (e.g. `loan-status-queue`) to the RabbitMQ broker.
2. **Immediate Return**: The microservice immediately returns success to the applicant's browser.
3. **Consume Event**: In the background, the **Notification Service** consumes the event, compiles the template, and sends the SMTP email asynchronously.

---

## 🎨 4. Frontend JWT Refresh Integration (Axios Interceptors)

The React SPA maintains a seamless session using custom Axios interceptors.

### **The Token Refresh Process**
- **Automatic Header Inject**: A request interceptor automatically attaches the current JWT token (`Bearer <token>`) from local storage.
- **Silence Refresh**: If a call fails with a `401 Unauthorized` (indicating token expiry), a response interceptor holds the pending requests, makes a POST request to `/auth/refresh` using the stored Refresh Token, updates the token, and automatically retries the failed requests.
- **Queue Synchronization**: A flag blocks duplicate refresh requests if multiple page queries fail at the same time, resolving them all once the token is renewed.
- **Auto Logout**: If the refresh token is also expired or missing, the local storage is cleared and the user is redirected to the login page.

---

## 💡 Summary Viva Cheat Sheet

- **Why Microservices?** Decoupled deployability, fault isolation, and independent resource scaling.
- **Why Database-per-Service?** Avoids database coupling and ensures services are independent. Cross-service relationships are managed logically via reference IDs.
- **Why RabbitMQ?** Decoupled background processing to keep HTTP response times fast.
- **Why Circuit Breaker?** Prevents a single service failure from bringing down the entire ecosystem.
