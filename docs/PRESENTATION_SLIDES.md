# 📊 FinFlow Presentation Slides

This document contains slide-by-slide bullet points you can copy directly into your presentation slides.

---

## Slide 1: Project Overview
* **FinFlow**: Modern Enterprise Loan Management System
* **Architecture**: Distributed Cloud-Native Microservices
* **Frontend**: Responsive React 19 Single Page Application (SPA)
* **Goal**: Automate end-to-end loan onboarding, document verification, and underwriting

---

## Slide 2: The Problem & Solution
* **Traditional Challenges**:
  * Manual KYC document collection and slow approval delays
  * Lack of transparency for application tracking
  * Monolithic dependencies leading to systemic failure risks
* **FinFlow Solution**:
  * 5-Step Guided Application Wizard
  * State-Machine driven loan lifecycle
  * Decoupled backend architecture with asynchronous notifications

---

## Slide 3: Microservices Infrastructure
* **API Gateway (8080)**: Edge security boundary, requests routing, and JWT check
* **Auth Service (8081)**: Identity provider, password hashing, and user registry
* **Application Service (8082)**: Loan application workflows and state changes
* **Admin Service (8083)**: Auditor reviews, holds, and decisioning
* **Document Service (8084)**: Secure files vault (stored as BLOB database data)
* **Eureka Registry (8761)**: Dynamic service discovery & lookup
* **Config Server (8889)**: Centralized external configuration repository

---

## Slide 4: Database & Messaging Design
* **Data Isolation**: Database-per-Service pattern
  * Separate MySQL schemas: `auth_db`, `app_db`, `doc_db`, `admin_db`
  * Logical relationships handled in the application layer
* **Asynchronous Messaging**: RabbitMQ Broker
  * Decouples heavy tasks (e.g. SMTP email sending) from REST request flows
  * Immediate HTTP responses for users; mail dispatch done in background

---

## Slide 5: Global Exception Governance
* **Standardized Errors**: Mapped using `@RestControllerAdvice`
* **Secure Formatting**: Returns unified JSON payloads (code, message, timestamp)
* **Benefit**: Consistent API client feedback; zero raw Java stack traces exposed

---

## Slide 6: Frontend Architecture & Token Refresh
* **UI Stack**: React 19 + Redux Toolkit + Vanilla CSS Variables
* **Axios Interceptors**:
  * Automatic JWT injection in requests
  * Silent refresh on `401 Unauthorized` responses
  * Sync queue: Stops duplicate refresh requests when multiple assets load

---

## Slide 7: Observability & Diagnostics
* **Distributed Tracing**: Zipkin maps inter-service call latencies
* **Log Aggregation**: Grafana Loki captures container logs
* **Metrics Scrape**: Prometheus collects JVM system health
* **Code Quality**: SonarQube static analysis scans code bugs

---

## Slide 8: Viva Q&A Summary
* **Q: Why separate the Document Service?**
  * A: File uploads are resource-heavy. Decoupling it keeps the main app responsive.
* **Q: Why use a Database-per-Service?**
  * A: It prevents schema dependencies. Services remain completely independent.
* **Q: How does the backend receive user identity?**
  * A: API Gateway validates the JWT, strips the signature, and passes details as headers.
