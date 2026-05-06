# 🏗️ System Architecture & Design

FinFlow is architected as a distributed system to ensure modularity, independent scalability, and high reliability. The following sections outline the core design principles and data flows.

---

## 🗺️ High-Level System Design

FinFlow follows a **Cloud-Native Microservices Architecture** designed for high availability, fault tolerance, and independent scalability.

```mermaid
graph TD
    Client[React Frontend] -->|REST| Gateway[API Gateway :8080]
    
    subgraph "Service Layer"
        Gateway --> Auth[Auth Service :8081]
        Gateway --> App[Application Service :8082]
        Gateway --> Admin[Admin Service :8083]
        Gateway --> Doc[Document Service :8084]
    end
    
    subgraph "Messaging Layer"
        App --> Rabbit[RabbitMQ Exchange]
        Auth --> Rabbit
        Rabbit --> Notif[Notification Service :8085]
    end
    
    subgraph "Persistence"
        Auth --- AuthDB[(MySQL)]
        App --- AppDB[(MySQL)]
        Doc --- DocDB[(MySQL)]
        Auth --- Redis[(Redis)]
    end
```

---

## 🏎️ Detailed Operational Flows

### **1. End-to-End Loan Submission Sequence**
The following chart visualizes how a request travels through the microservice mesh, including security validation and asynchronous event propagation.

```mermaid
sequenceDiagram
    participant User as Applicant (Frontend)
    participant GW as API Gateway (8080)
    participant Auth as Auth Service (8081)
    participant App as App Service (8082)
    participant Doc as Doc Service (8084)
    participant MQ as RabbitMQ
    participant Notif as Notification Service (8085)

    User->>GW: POST /api/applications/submit (JWT)
    GW->>Auth: Validate JWT & Extract Identity
    Auth-->>GW: OK (UserID: 123, Role: APPLICANT)
    
    GW->>App: Finalize Submission
    activate App
    App->>App: Validate Document Status
    App->>App: Update Status to 'SUBMITTED'
    
    App->>MQ: Publish 'LOAN_SUBMITTED' Event
    deactivate App
    
    App-->>GW: 200 OK (Success)
    GW-->>User: Update UI Dashboard
    
    Note over MQ, Notif: Asynchronous Background Process
    MQ->>Notif: Consume 'LOAN_SUBMITTED'
    activate Notif
    Notif->>Notif: Generate Email Template
    Notif->>User: Send Email Alert (SMTP)
    deactivate Notif
```

---

### **2. Loan Life-Cycle State Machine**
How the system manages the "Source of Truth" for an application status.

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Application
    DRAFT --> SUBMITTED: Complete 5-Step Wizard
    SUBMITTED --> REVIEW: Admin Begins Audit
    
    state REVIEW {
        [*] --> PENDING_VERIFICATION
        PENDING_VERIFICATION --> DOCS_VERIFIED: Docs Approved
        PENDING_VERIFICATION --> REUPLOAD: Docs Blurry/Missing
        REUPLOAD --> PENDING_VERIFICATION: User Re-uploads
    }
    
    DOCS_VERIFIED --> APPROVED: Final Decision (Credit Check OK)
    DOCS_VERIFIED --> REJECTED: Final Decision (Risk High)
    
    APPROVED --> [*]
    REJECTED --> [*]
```

---

## ⚡ Core Operational Flows

### **1. Secure Onboarding & Authentication**
- **Identity Issuance**: The `Auth Service` handles registration and MFA. Upon success, it issues a signed JWT.
- **Edge Security**: The `API Gateway` validates the JWT for every request and injects user identity headers (Role, UserID) into the downstream request context.

### **2. Loan Application Lifecycle**
- **State Machine**: The `Application Service` manages the transition of an application through various states: `DRAFT` ➔ `SUBMITTED` ➔ `REVIEW` ➔ `DECISION`.
- **Validation**: Each step of the 5-step wizard is validated both on the client-side and at the service layer to ensure data integrity.

### **3. Document Orchestration**
- **Secure Mapping**: The `Document Service` manages metadata and links files to specific applications. 
- **Administrative Access**: Files are retrieved via secure endpoints that verify the requester's `ADMIN` role before granting access to the storage layer.

### **4. Event-Driven Notifications**
- **Decoupling**: To prevent blocking the main thread, all alerts (Email/In-App) are handled via **RabbitMQ**.
- **Execution**: Services publish events (e.g., `LOAN_APPROVED`) to the message broker, which the `Notification Service` consumes and processes in the background.

---

## 🛠️ Infrastructure & Observability

### **Service Governance**
- **Netflix Eureka**: Provides service discovery, allowing microservices to locate each other dynamically without hardcoded URLs.
- **Config Server**: Centralizes configuration (YAML/Properties) for all services, enabling environment-specific tuning.

### **Monitoring Stack**
- **Distributed Tracing**: Brave/Zipkin for visualizing the request path across service boundaries.
- **Metrics**: Micrometer and Prometheus for tracking system health and business KPIs.
- **Logging**: Grafana Loki for centralized, label-based log aggregation.

---

## 🔐 Design Principles
- **Database per Service**: Prevents tight coupling and ensures schema independence.
- **Statelessness**: No session data is stored on the server; all identity is carried by the JWT.
- **Idempotency**: All mutation requests (POST/PATCH) include a client-generated UUID to prevent duplicate operations in case of network retries.
