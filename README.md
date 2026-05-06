# 🌊 FinFlow | Enterprise Loan Management System

FinFlow is a high-performance, microservices-based platform designed to automate the end-to-end loan application and underwriting process. It combines a premium React frontend with a resilient Spring Boot backend to deliver a secure and scalable financial ecosystem.

---

## 📋 Core Capabilities

### 🔹 Applicant Experience
- **Guided Application**: A 5-step intuitive wizard for personal, employment, and loan data.
- **Secure Document Vault**: Automated mapping and storage of KYC and financial documents.
- **Live Status Tracking**: Real-time progress monitoring via an interactive timeline.
- **Async Notifications**: Instant alerts for application milestones and administrative actions.

### 🔹 Administrative Governance
- **Underwriting Control Center**: Centralized dashboard for reviewing and decisioning applications.
- **Risk Assessment**: Detailed profile views including document verification and history audits.
- **Operational Auditing**: Full traceability of all administrative status changes and remarks.
- **Analytical Intelligence**: Real-time visualization of loan trends and approval metrics.

---

## 🏗️ Technical Architecture

The system is built on a **Cloud-Native Microservices** foundation using the Spring Cloud ecosystem.

### **Service Infrastructure**
- **API Gateway (8080)**: Centralized entry point handling edge security, routing, and idempotency.
- **Auth Service (8081)**: Identity provider using JWT, MFA logic, and profile management.
- **Application Service (8082)**: Manages core loan state machine and lifecycle transitions.
- **Admin Service (8083)**: Handles internal governance, decisioning, and reporting.
- **Document Service (8084)**: Orchestrates secure file storage and metadata mapping.
- **Notification Service (8085)**: Consumes RabbitMQ events to dispatch alerts asynchronously.
- **Service Discovery (8761)**: Dynamic registry using Netflix Eureka.
- **Config Server (8888)**: Externalized configuration management for all environments.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Redux Toolkit, Framer Motion, Axios, Lucide |
| **Backend** | Spring Boot 3.2, Spring Security, Spring Cloud, Hibernate |
| **Messaging** | RabbitMQ (AMQP) |
| **Database** | MySQL (Persistent), Redis (Caching) |
| **Observability** | Zipkin, Prometheus, Grafana, Loki |

---

### **📡 Service Connectivity Matrix**

| Source Service | Target Service | Interaction Type | Protocol | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | ALL Services | Edge Routing | REST/HTTP | Request filtering & Auth validation |
| **Auth Service** | Redis | Caching | Jedis | OTP storage & session management |
| **App Service** | Auth Service | Identity Check | Feign/REST | Verify applicant profile details |
| **App Service** | RabbitMQ | Event Dispatch | AMQP | Offload notification tasks |
| **Doc Service** | App Service | Metadata Sync | REST/HTTP | Link files to specific loan IDs |
| **Notif Service** | RabbitMQ | Event Consume | AMQP | Process background alerts |
| **ALL Services** | Config Server | Bootstrap | Config Client | Fetch environment properties |
| **ALL Services** | Eureka | Registration | Discovery | Heartbeat & service discovery |

---

## 🚀 Deployment & Startup

### **1. Prerequisites**
- Java 17+, Node.js 18+
- MySQL, Redis, RabbitMQ (Active services)

### **2. One-Step Startup**
The root directory includes a master script to initialize the entire stack:
```bash
./START_ALL.bat
```
*This will launch the Frontend dev server and bootstrap all Microservices.*

### **3. Infrastructure Access**
- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Eureka Registry**: [http://localhost:8761](http://localhost:8761)
- **Zipkin Traces**: [http://localhost:9411](http://localhost:9411)

---

## 🔐 Security Framework
- **Identity**: Stateless JWT authentication with identity pinning.
- **Encryption**: BCrypt password hashing and sensitive data isolation.
- **RBAC**: Strict Role-Based Access Control enforced at the Gateway level.
- **Persistence**: Database-per-service pattern to ensure data isolation.

---
**Author**: Durga Prasad  
**License**: [MIT](./LICENSE)