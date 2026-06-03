# 📊 FinFlow Presentation Slides (Detailed Edition)

This guide provides structured content, timing suggestions, and speaker scripts for presenting the FinFlow project.

---

## Slide 1: Title Slide & Project Scope
* **Visual Guideline**: Centered title, clean microservices sub-icons.
* **Timing**: 1 Minute
* **Slide Content**:
  * **Title**: FinFlow | Enterprise Loan Management System
  * **Architecture**: Distributed Cloud-Native Microservices
  * **Presenter**: [Your Name]
* **Speaker Script**: 
  > "Good morning panel. Today I will present FinFlow, an enterprise-grade Loan Management System built on a distributed microservices backend and a modern React 19 single-page application. I will demonstrate its architecture, data isolation, and resilience features."

---

## Slide 2: Requirement Analysis & Problem Statement
* **Visual Guideline**: Two columns showing manual bottlenecks vs. FinFlow features.
* **Timing**: 1.5 Minutes
* **Slide Content**:
  * **Problems in Traditional Systems**:
    * Manual document collection and physical file storage risks.
    * Lack of real-time application status updates for the user.
    * Monolithic codebases with single points of failure.
  * **FinFlow Solutions**:
    * 5-Step Guided Loan Application Wizard.
    * Secure Document Vault with database-backed BLOB uploads.
    * Strict state-machine controlled loan lifecycle.
* **Speaker Script**: 
  > "Traditional loan processing is slow and opaque. FinFlow replaces this with a digital applicant wizard, an automated document vault, and a state-machine driven backend that guides applications securely from draft to underwriting."

---

## Slide 3: Microservices Ecosystem Architecture
* **Visual Guideline**: Block diagram showing edge gateway, service discovery, services, and databases.
* **Timing**: 2 Minutes
* **Slide Content**:
  * **API Gateway (:8080)**: Edge security boundary and request router.
  * **Eureka Registry (:8761)**: Dynamic service registration.
  * **Config Server (:8889)**: Centralized configuration management.
  * **Core Microservices**:
    * Auth (:8081) — JWT Identity Provider.
    * Application (:8082) — Loan Drafts & Lifecycle.
    * Admin (:8083) — Decisioning & Audit Logs.
    * Document (:8084) — Secure File BLOB storage.
* **Speaker Script**: 
  > "FinFlow is built as a set of independent microservices. The API Gateway serves as our secure edge, verifying JWTs and routing downstream, while services register dynamically with the Eureka discovery registry."

---

## Slide 4: Database Isolation & Messaging
* **Visual Guideline**: Table of schemas and MQ queue diagrams.
* **Timing**: 1.5 Minutes
* **Slide Content**:
  * **Database-per-Service Pattern**:
    * Schemas: `auth_db`, `app_db`, `doc_db`, `admin_db`.
    * Decouples data layouts; relationships are mapped logically via reference IDs.
  * **Asynchronous Broker (RabbitMQ)**:
    * Publishes events (e.g. `loan.submitted`) to a Topic Exchange.
    * Notification Service consumes events and sends emails asynchronously in the background.
* **Speaker Script**: 
  > "We enforce database-per-service isolation to keep schemas fully decoupled. For background tasks like email dispatching, we publish events to RabbitMQ, offloading work to the Notification Service to keep HTTP response times sub-second."

---

## Slide 5: Global Exception Governance & Resilience
* **Visual Guideline**: Centralized interceptor flowchart.
* **Timing**: 1.5 Minutes
* **Slide Content**:
  * **Centralized Exception Handling**:
    * `@RestControllerAdvice` captures errors across all controllers.
    * Returns consistent error responses and shields raw Java stack traces.
  * **Resilience4j Circuit Breaker**:
    * Wraps Feign Client calls from `admin-service` to `application-service`.
    * Implements fallback methods to return graceful defaults if a target service crashes.
* **Speaker Script**: 
  > "We ensure API stability and security using Global Exception interceptors to prevent raw stack trace leaks. Furthermore, we protect inter-service communications using Resilience4j circuit breakers to handle downtimes gracefully."

---

## Slide 6: Frontend Architecture & Token Refresh
* **Visual Guideline**: Timeline showing silent token refresh flow.
* **Timing**: 1.5 Minutes
* **Slide Content**:
  * **Core UI**: React 19 Single Page Application with Redux Toolkit state.
  * **Axios Interceptors**:
    * Requests: Automatically appends `Authorization` bearer token.
    * Responses: Intercepts `401 Unauthorized` and silently performs a Token Refresh.
  * **Request Queue**: Queue blocks duplicate refresh calls when multiple queries fail at once.
* **Speaker Script**: 
  > "The frontend is built on React 19. It uses Axios interceptors to inject JWTs and automatically request fresh tokens if an access token expires mid-session, avoiding manual logouts and keeping the experience seamless."

---

## Slide 7: Diagnostics & Quality Control
* **Visual Guideline**: Logo grids for observability tools.
* **Timing**: 1 Minute
* **Slide Content**:
  * **Zipkin**: Distributed tracing mapping microservice request paths.
  * **Grafana Loki**: Centralized log aggregator collecting stdout logs.
  * **Prometheus**: Scrapes metrics from Spring Boot actuator endpoints.
  * **SonarQube**: Enforces code quality gates and vulnerability scans.
* **Speaker Script**: 
  > "Finally, we maintain total visibility. The system integrates Zipkin for tracing, Loki for log aggregation, Prometheus for metrics, and SonarQube for static code analysis, ensuring code security and quality."

---

## Slide 8: Viva Q&A Cheat Sheet
* **Common Questions & Answers**:
  * **Q**: What happens if the Notification Service fails?
    * *A*: Events remain queued in RabbitMQ and will be processed immediately once the service recovers.
  * **Q**: Why validate JWTs at the Gateway?
    * *A*: Centralizing JWT validation at the gateway eliminates the overhead of repeating signature checks in downstream microservices.
  * **Q**: How are file uploads kept efficient?
    * *A*: They are isolated inside the Document Service, preventing heavy byte transfer loads from clogging the core Application Service thread pool.
* **Speaker Script**: 
  > "I am now open to questions. Thank you."
