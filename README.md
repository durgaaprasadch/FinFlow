# 🌊 FinFlow | Enterprise Loan Management System

FinFlow is a high-performance, microservices-based platform designed to automate the end-to-end loan application and underwriting process. It combines a premium React frontend with a resilient Spring Boot backend to deliver a secure and scalable financial ecosystem.

---

## 📂 Project Structure

```
FinFlow/
├── finflow-frontend/     # React 19 Web Portal (Vite, Redux Toolkit, Framer Motion)
├── finflow-backend/      # Spring Boot 3.2 Microservices & Docker Infrastructure
│   ├── config-server/    # Spring Cloud Config Server
│   ├── eureka-server/    # Service Discovery (Netflix Eureka)
│   ├── api-gateway/      # Edge Service & Security Gateway
│   ├── auth-service/     # Identity & Session Management Service
│   ├── application-service/ # Loan Lifecycle State Machine Service
│   ├── admin-service/    # Governance & Decision Service
│   ├── document-service/ # Secure Document Vault Service (BLOB storage)
│   ├── notification-service/ # Asynchronous Alerts Service (RabbitMQ Listener)
│   ├── config-repo/      # Native Config Repository (YAML configurations)
│   ├── infrastructure/   # Database scripts & Docker volume mappings
│   └── observability/    # Monitoring (Prometheus, Promtail, Loki config)
├── docs/                 # System Design Diagrams, Technical Presentation & Slides
├── START_ALL.bat         # Master startup script (Windows)
└── STOP_ALL.bat          # Master teardown script (Windows)
```

---

## 📋 Core Capabilities

### 🔹 Applicant Experience
- **Guided Application**: A 5-step intuitive wizard for personal, employment, and loan data.
- **Secure Document Vault**: Automated mapping and storage of KYC and financial documents (Aadhaar, PAN, Salary Slips, Bank Statements, Photos).
- **Live Status Tracking**: Real-time progress monitoring via an interactive timeline.
- **Async Notifications**: Instant alerts for application milestones and administrative actions.

### 🔹 Administrative Governance
- **Underwriting Control Center**: Centralized dashboard for reviewing and decisioning applications.
- **Risk Assessment**: Detailed profile views including document verification and history audits.
- **Operational Auditing**: Full traceability of all administrative status changes and remarks.
- **Analytical Intelligence**: Real-time visualization of loan trends and approval metrics.

---

## 🏗️ Technical Architecture & Port Mapping

The system is built on a **Cloud-Native Microservices** foundation using the Spring Cloud ecosystem.

| Service Name | Port | Description | Health/Actuator URL |
| :--- | :--- | :--- | :--- |
| **API Gateway** | `8080` | Entry point handling edge routing, security, and rate limiting | [Actuator Health](http://localhost:8080/actuator/health) |
| **Auth Service** | `8081` | JWT identity provider, profile details, and authentication | [Actuator Health](http://localhost:8081/actuator/health) |
| **Application Service** | `8082` | Core loan draft creation, editing, and submission lifecycle | [Actuator Health](http://localhost:8082/actuator/health) |
| **Admin Service** | `8083` | Underwriter decision logic, auditing, holds, and reporting | [Actuator Health](http://localhost:8083/actuator/health) |
| **Document Service** | `8084` | Uploads, retrieves, and maps application documents (BLOB format) | [Actuator Health](http://localhost:8084/actuator/health) |
| **Notification Service** | `8085` | Consumes RabbitMQ events to send transactional emails | [Actuator Health](http://localhost:8085/actuator/health) |
| **Eureka Registry** | `8761` | Microservice Registration & Service Discovery | [Eureka Dashboard](http://localhost:8761/) |
| **Config Server** | `8889` | Externalized configuration management for all environments | [Config Server Health](http://localhost:8889/actuator/health) |
| **Frontend Portal** | `5173` | React User Interface | [Frontend Home](http://localhost:5173/) |

---

## 📡 Service Connectivity Matrix

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

### **Option 1: One-Step Docker Compose Deployment (Recommended)**
The easiest way to bootstrap the entire system, including databases, messaging, and observability platforms:

1. **Build and Start Container Stack**:
   ```bash
   cd finflow-backend
   docker-compose up --build -d
   ```
2. **Access the Frontend Portal**:
   Navigate to [http://localhost:5173](http://localhost:5173).

---

### **Option 2: Running Locally (Windows Native)**

#### **1. Prerequisites**
Ensure you have the following installed and running on your system:
- **Java JDK 17** or higher
- **Node.js 18** or higher
- **MySQL Server** (running on port `3306`)
- **Redis Server** (running on port `6379`)
- **RabbitMQ Server** (running on port `5672`/`15672`)

#### **2. Start the Stack**
Run the master script in the root directory (run as Administrator to allow starting Windows services):
```bash
./START_ALL.bat
```
*This will automatically launch the Frontend Vite server, start database/messaging services, and bootstrap all 8 backend microservices in separate PowerShell windows.*

#### **3. Stop the Stack**
To close all running background processes and services, run:
```bash
./STOP_ALL.bat
```

---

## 📊 Observability & Quality Assurance

FinFlow is integrated with a comprehensive monitoring and logging stack. When running through Docker Compose, you can access the dashboards at the following URLs:

- **Zipkin (Distributed Tracing)**: [http://localhost:9411](http://localhost:9411) — Trace microservice dependency call latency and inspect request flows.
- **Grafana (Metrics & Logs)**: [http://localhost:3000](http://localhost:3000) (User: `admin` / Password: `admin`) — Visualize Prometheus metrics and Loki log streams.
- **Prometheus (Metrics Database)**: [http://localhost:9090](http://localhost:9090) — Run custom PromQL queries.
- **SonarQube (Code Quality)**: [http://localhost:9000](http://localhost:9000) (User: `admin` / Password: `admin`) — Review static analysis, code coverage, and bug vulnerability gates.

---

## 🛠️ Manual Build & Compilation

If you want to manually build or package the services without launching them:

### **Backend Build**
Navigate to the backend directory and compile all Spring Boot fat JARs using Maven:
```bash
cd finflow-backend
mvn clean package -DskipTests
```

### **Frontend Build**
Navigate to the frontend directory, install dependencies, and build the static assets for production:
```bash
cd finflow-frontend
npm install
npm run build
```
*The optimized production files will be output to `finflow-frontend/dist/`.*

---

## 🔐 Security Framework
- **Identity**: Stateless JWT token authentication with identity-context pinning header propagation.
- **Encryption**: BCrypt password hashing, secure tokens, and database isolation.
- **RBAC**: Strict Role-Based Access Control (`ROLE_APPLICANT`, `ROLE_ADMIN`) checked and routed at the Gateway level.
- **Persistence**: Database-per-service pattern (4 isolated schemas in MySQL) ensuring data decoupling and integrity.

---
**Author**: Durga Prasad  
**License**: [MIT](./LICENSE)