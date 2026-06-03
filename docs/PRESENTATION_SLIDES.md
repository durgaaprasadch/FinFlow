# 📊 FinFlow Presentation Slides (Detailed Edition)

This guide provides structured content, timing, and speaker notes for your project defense/viva presentation.

---

## Slide 1: Title Slide & Project Overview
- **Visual Layout**: Large bold title, clean sub-headings, minimal design.
- **Content**:
  - **Project Title**: FinFlow | Enterprise-Grade Loan Management System
  - **Subtitle**: Distributed Microservices Architecture & Modern UI/UX
  - **Presenter**: [Your Name]
  - **Date**: [Presentation Date]
- **Target Timing**: 1 Minute
- **Speaker Notes**: 
  > "Good morning panel. Today I will present FinFlow, an enterprise-grade Loan Management System designed to automate the loan application, document verification, and administrative decisioning workflow using a secure microservices architecture and a responsive React frontend."

---

## Slide 2: Problem Definition & Modern Solution
- **Visual Layout**: Two-column layout (Left: Problems in traditional systems, Right: FinFlow's solution).
- **Content**:
  - **Traditional Problems**:
    - Manual document processing, slow underwriting cycles.
    - Lack of transparency in application tracking.
    - Monolithic architectures causing single points of failure.
  - **FinFlow's Solution**:
    - 5-Step guided digital onboarding wizard.
    - Automated document mapping and state-machine-driven lifecycle.
    - Resilient microservices with asynchronous notifications.
- **Target Timing**: 1.5 Minutes
- **Speaker Notes**: 
  > "Traditional loan processing is slow, paper-heavy, and opaque. FinFlow solves this by digitizing the applicant journey and automating back-office underwriting, using state machines to ensure loan files progress securely."

---

## Slide 3: Microservices Ecosystem & Architecture
- **Visual Layout**: High-level block diagram showing API Gateway, Core Services, Discovery, and Databases.
- **Content**:
  - **Edge Control**: API Gateway (:8080) for stateless routing and security.
  - **Core Engines**:
    - Auth Service (:8081) — JWT Identity Provider.
    - Application Service (:8082) — Loan Drafts & Lifecycle.
    - Admin Service (:8083) — Underwriting & Audits.
    - Document Service (:8084) — Secure File Repository.
  - **Asynchronous messaging**: Notification Service (:8085) consuming RabbitMQ events.
  - **Infrastructure**: Netflix Eureka (:8761) Discovery & Config Server (:8889).
- **Target Timing**: 2 Minutes
- **Speaker Notes**: 
  > "Our backend is decoupled into single-responsibility microservices. The API Gateway routes requests and validates JWTs, while services register themselves with Eureka and pull externalized configurations from our Config Server."

---

## Slide 4: Database Design & Service Isolation
- **Visual Layout**: Table showing schemas per service, plus logical relationship annotations.
- **Content**:
  - **Database-per-Service**: Strong isolation to prevent service coupling.
  - **Schema Breakdown**:
    - `auth_db` — User logins and audit logs.
    - `app_db` — Applications and employment details.
    - `doc_db` — Binary document files (BLOBs).
    - `admin_db` — Underwriting history, holds, and verification logs.
  - **Cross-Service Links**: Managed logically in the application layer using ID referencing instead of physical relational constraints.
- **Target Timing**: 1.5 Minutes
- **Speaker Notes**: 
  > "To enforce decoupling, we use a database-per-service pattern. Each service owns its tables. Relationships like linking an application to its documents are managed logically using UUIDs/IDs in code, rather than physical SQL foreign keys."

---

## Slide 5: Core Feature: Global Exception Handling
- **Visual Layout**: Standard flow chart showing request ➔ exception ➔ `@RestControllerAdvice` interception ➔ JSON response.
- **Content**:
  - **Pattern**: Centralized exception governance via `@RestControllerAdvice` and `@ExceptionHandler`.
  - **Custom Bounds**: Specialized exceptions (e.g. `AuthException`, `DocumentException`) mapped to unique HTTP status codes.
  - **Unified Payload**: Returns consistent JSON objects containing timestamp, status code, error details, and custom error codes.
  - **Benefit**: Never leaks database stack traces or compiler exceptions to the user.
- **Target Timing**: 1.5 Minutes
- **Speaker Notes**: 
  > "For robust system resilience, we use Global Exception Advisors in Spring. When an error occurs, it is intercepted and converted to a structured JSON response. This keeps API clients stable and prevents raw stack traces from exposing security details."

---

## Slide 6: Asynchronous Event-Driven Messaging
- **Visual Layout**: Flow diagram showing App Service publishing to RabbitMQ and Notification Service sending emails.
- **Content**:
  - **Protocol**: AMQP via RabbitMQ.
  - **Decoupled Workflow**: Submitting or approving a loan publishes a message to a `Topic Exchange`.
  - **Async Processing**: Notification service consumes the event asynchronously, renders templates, and dispatches SMTP emails without blocking the main thread.
  - **Resilience**: RabbitMQ guarantees message delivery even if the notification server experiences temporary downtime.
- **Target Timing**: 2 Minutes
- **Speaker Notes**: 
  > "Blocking threads with operations like sending SMTP emails leads to bad user experience. FinFlow publishes status changes to a RabbitMQ exchange, and our Notification Service processes them in the background, keeping the frontend fast and responsive."

---

## Slide 7: Frontend Architecture & Token Refresh
- **Visual Layout**: Sequence diagram showing Axios intercepting expired token, requesting refresh, and retrying.
- **Content**:
  - **Core UI**: React 19 SPA powered by Redux Toolkit for global state.
  - **Axios Client Interceptors**:
    - *Request Interceptor*: Automatically attaches the JWT `Bearer` token to headers.
    - *Response Interceptor*: Intercepts `401 Unauthorized` responses and silently requests a new Access Token using a Refresh Token.
  - **Synchronization**: Failed request queue prevents duplicate refresh calls when multiple requests fail concurrently.
- **Target Timing**: 1.5 Minutes
- **Speaker Notes**: 
  > "On the client side, React 19 communicates with the Gateway using Axios. The response interceptor silently handles expired JWTs. If a 401 occurs, it halts requests, requests a fresh token, and retries the original requests in the background."

---

## Slide 8: Observability Stack & Quality Metrics
- **Visual Layout**: Grid showing logo tags for Zipkin, Prometheus, Grafana, Loki, and SonarQube.
- **Content**:
  - **Distributed Tracing**: Zipkin tracks call paths and identifies gateway bottleneck latencies.
  - **Log Aggregation**: Grafana Loki collects stdout log streams from all containers.
  - **Monitoring**: Prometheus scrapes JVM metrics from Spring Boot actuators.
  - **Code Quality**: SonarQube gates static code analysis and tests code coverage.
- **Target Timing**: 1 Minute
- **Speaker Notes**: 
  > "Finally, we maintain high system visibility. Our Docker Compose stack bundles Zipkin for request tracing, Prometheus for JVM metrics, Loki for unified logging, and SonarQube to enforce code quality gates."

---

## Slide 9: Viva Q&A Cheat Sheet
- **Heading**: Common Evaluator Questions & Answers
  1. **Q**: What happens if one microservice goes down?
     - **A**: The system remains functional. The API Gateway routes around it, and Resilience4j circuit breakers return fallbacks.
  2. **Q**: Why store documents in MySQL BLOB instead of local storage?
     - **A**: It ensures strict access control and database transactional boundaries, preventing orphan files or local directory configuration leaks.
  3. **Q**: How is user context propagated across services?
     - **A**: API Gateway validates the JWT, strips the signature, and forwards user details downstream in standard HTTP headers (`userRole`, `applicantId`).
- **Target Timing**: 1 Minute
- **Speaker Notes**: 
  > "I am now open to questions. Thank you for your time."
