# 📊 FinFlow Design Diagrams & Flowcharts

This document provides the complete structural and behavioral blueprint of the FinFlow Enterprise Loan Management System.

---

## 1. Actor Use Case Diagram
This diagram illustrates the boundaries of the system and how different actors (Applicants, Underwriters/Admins, and System Services) interact with core capabilities.

```mermaid
graph TD
    subgraph Actors
        A["👤 Applicant"]
        AD["💼 Underwriter / Admin"]
        SYS["🤖 Background System"]
    end

    subgraph "FinFlow System Boundaries"
        UC_Register("Register & Verify Account (OTP)")
        UC_Login("Login & Multi-Factor Auth")
        UC_Apply("Apply for Loan (5-Step Wizard)")
        UC_Upload("Upload Documents to Vault")
        UC_Track("Track Application Timeline")
        
        UC_Review("Review Loan Dossier")
        UC_Verify("Verify KYC Documents")
        UC_Decision("Decision Application (Approve/Reject)")
        UC_Hold("Place/Release Application Hold")
        
        UC_Notify("Dispatch Async Notifications")
    end

    A --> UC_Register
    A --> UC_Login
    A --> UC_Apply
    A --> UC_Upload
    A --> UC_Track

    AD --> UC_Login
    AD --> UC_Review
    AD --> UC_Verify
    AD --> UC_Decision
    AD --> UC_Hold

    UC_Apply -.->|triggers| UC_Notify
    UC_Decision -.->|triggers| UC_Notify
    UC_Hold -.->|triggers| UC_Notify
    SYS --> UC_Notify
```

---

## 2. Microservices Architecture
The system utilizes a **Database-per-Service** design, orchestrated via Spring Cloud Service Discovery (Eureka) and Config Server, and monitored through Loki, Prometheus, Grafana, and Zipkin.

```mermaid
graph TB
    Client["📱 React Web Portal (:5173)"] -->|HTTP/REST| Gateway["🚧 API Gateway (:8080)"]

    subgraph "Service Discovery & Configuration"
        Config["⚙️ Config Server (:8889)"]
        Eureka["🔍 Eureka Registry (:8761)"]
    end

    subgraph "Core Microservices"
        Auth["🔐 Auth Service (:8081)"]
        App["📝 Application Service (:8082)"]
        Admin["👔 Admin Service (:8083)"]
        Doc["📁 Document Service (:8084)"]
    end

    subgraph "Asynchronous Messaging"
        Rabbit["Message Broker (RabbitMQ :5672)"]
        Notif["✉️ Notification Service (:8085)"]
    end

    subgraph "Databases & Cache"
        RedisDB[("缓存 Redis (:6379)")]
        AuthDB[("数据库 auth_db")]
        AppDB[("数据库 app_db")]
        AdminDB[("数据库 admin_db")]
        DocDB[("数据库 doc_db")]
    end

    %% Routing
    Gateway --> Auth
    Gateway --> App
    Gateway --> Admin
    Gateway --> Doc

    %% Config & Registry mappings
    Auth & App & Admin & Doc & Notif & Gateway -.->|bootstrap| Config
    Auth & App & Admin & Doc & Notif & Gateway -.->|register| Eureka

    %% Inter-service calls
    App -->|Feign Client| Auth
    Doc -->|REST Callback| App
    Admin -->|Feign Client| App

    %% Messaging
    App & Auth & Admin & Doc -->|Publish Events| Rabbit
    Rabbit -->|Consume Messages| Notif

    %% DB Mappings
    Auth --- AuthDB
    Auth --- RedisDB
    App --- AppDB
    Admin --- AdminDB
    Doc --- DocDB
```

---

## 3. Database Logical ERD (Database-per-Service Model)
Each microservice owns its schema. Integration across schemas is performed through **logical foreign keys** managed at the application level.

```mermaid
erDiagram
    %% Auth Service DB
    USER_ACCOUNTS {
        Long id PK
        String email UK
        String password_hash
        String full_name
        String role "APPLICANT, ADMIN"
        Boolean is_active
        DateTime created_at
    }
    
    LOGIN_AUDIT_LOGS {
        Long id PK
        Long user_id FK
        String ip_address
        String status "SUCCESS, FAILED"
        DateTime login_time
    }

    %% Application Service DB
    LOAN_APPLICATIONS {
        Long id PK
        Long applicant_id FK "Logical FK to USER_ACCOUNTS.id"
        String loan_type "PERSONAL, HOME, EDUCATION"
        Double requested_amount
        Double approved_amount
        Integer tenure_months
        String status "DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, HOLD"
        String purpose
        DateTime submitted_at
        DateTime updated_at
    }

    EMPLOYMENT_DETAILS {
        Long id PK
        Long application_id FK
        String employer_name
        Double monthly_income
        String occupation
        Integer work_experience_years
    }

    %% Document Service DB
    LOAN_DOCUMENTS {
        Long id PK
        Long application_id FK "Logical FK to LOAN_APPLICATIONS.id"
        String file_name
        String file_type
        Long file_size
        Binary file_data "BLOB storage"
        String document_type "AADHAAR, PAN, SALARY_SLIP, BANK_STATEMENT, PHOTO"
        DateTime uploaded_at
    }

    %% Admin Service DB
    UNDERWRITING_AUDITS {
        Long id PK
        Long application_id FK "Logical FK to LOAN_APPLICATIONS.id"
        Long auditor_id FK "Logical FK to USER_ACCOUNTS.id"
        String decision "APPROVED, REJECTED, HOLD"
        String remarks
        DateTime audited_at
    }

    APPLICATION_HOLDS {
        Long id PK
        Long application_id FK
        String hold_reason
        String otp_code
        Boolean is_verified
        DateTime created_at
    }

    %% Logical Cross-Service Relationships
    USER_ACCOUNTS ||--o{ LOGIN_AUDIT_LOGS : "logs"
    USER_ACCOUNTS ||--o{ LOAN_APPLICATIONS : "submits (logical)"
    LOAN_APPLICATIONS ||--|| EMPLOYMENT_DETAILS : "requires"
    LOAN_APPLICATIONS ||--o{ LOAN_DOCUMENTS : "contains (logical)"
    LOAN_APPLICATIONS ||--o{ UNDERWRITING_AUDITS : "audited_by (logical)"
    LOAN_APPLICATIONS ||--o{ APPLICATION_HOLDS : "restricts (logical)"
```

---

## 4. End-to-End Loan Flow (Sequence Diagram)
This diagram illustrates the chronological request-response lifecycle when an applicant creates, drafts, uploads documents, and submits a loan application, which is then decisioned by an administrator.

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as 👤 Applicant
    participant UI as 📱 React UI
    participant GW as 🚧 API Gateway
    participant AuthS as 🔐 Auth Service
    participant AppS as 📝 Application Service
    participant DocS as 📁 Document Service
    participant AdminS as 👔 Admin Service
    participant Rabbit as 🐇 RabbitMQ
    participant NotifS as ✉️ Notification Service

    %% Step 1: Draft Creation
    Applicant->>UI: Fills out Loan Details (Step 1)
    UI->>GW: POST /api/applications (Draft)
    GW->>AuthS: Validate JWT Token
    AuthS-->>GW: Token Valid (Role: APPLICANT)
    GW->>AppS: Route request to /applications
    AppS->>AppS: Validate input & create application in DRAFT state
    AppS-->>GW: Return Application Draft (ID: 101)
    GW-->>UI: Display Step 2 (Employment Details)

    %% Step 2: Document Upload
    Applicant->>UI: Uploads KYC Files (Step 4)
    UI->>GW: POST /api/documents/upload-all (ID: 101)
    GW->>DocS: Route payload to /documents
    DocS->>DocS: Scan files & compress into BLOBs
    DocS->>AppS: REST check ownership (App ID 101 == User)
    AppS-->>DocS: Owner Verified
    DocS->>DocS: Save BLOBs in DB (doc_db)
    DocS-->>GW: Return Upload Confirmation
    GW-->>UI: Display Step 5 (Review and Submit)

    %% Step 3: Application Submission
    Applicant->>UI: Clicks "Submit Application"
    UI->>GW: PATCH /api/applications/submit
    GW->>AppS: Route to /applications/submit
    AppS->>AppS: Verify all steps & docs completed
    AppS->>AppS: Transition State to SUBMITTED
    AppS->>Rabbit: Publish event (application.submitted)
    AppS-->>GW: Return Submission Success
    GW-->>UI: Display "Status: Submitted"
    
    %% Asynchronous Notifications
    Rabbit->>NotifS: Deliver event payload
    NotifS->>NotifS: Render HTML Email Template
    NotifS->>Applicant: Send transactional confirmation email

    %% Step 4: Admin Decision
    actor Admin as 💼 Underwriter / Admin
    Admin->>UI: Log in & Open Admin Panel
    UI->>GW: GET /api/admin/applications/all
    GW->>AdminS: Route to /admin/applications
    AdminS->>AppS: Fetch all applications
    AppS-->>AdminS: Return Applications List
    AdminS-->>GW: Return applications JSON
    UI-->>Admin: Display submitted applications
    
    Admin->>UI: Approves Loan (ID: 101)
    UI->>GW: PATCH /api/admin/applications/101/decision (APPROVED)
    GW->>AdminS: Route to /admin/applications/101/decision
    AdminS->>AppS: Update application status to APPROVED
    AppS-->>AdminS: Confirm status updated
    AdminS->>AdminS: Log Audits in DB (admin_db)
    AdminS->>Rabbit: Publish event (application.approved)
    AdminS-->>GW: Return Decision Success
    GW-->>UI: Display approval logged
    
    %% Async Notification for approval
    Rabbit->>NotifS: Deliver approval event
    NotifS->>Applicant: Send "Loan Approved" email
```

---

## 5. Loan Application State Machine Transition Diagram
The transition of a loan application status is strict. The diagram below shows allowed state transitions.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Application (Step 1)
    DRAFT --> DRAFT : Update Personal/Employment/Loan Details
    DRAFT --> SUBMITTED : Submit Application (Step 5)
    
    SUBMITTED --> UNDER_REVIEW : Underwriter Opens Application
    UNDER_REVIEW --> HOLD : Underwriter requests re-upload/clarification
    HOLD --> UNDER_REVIEW : Applicant uploads corrected files
    
    UNDER_REVIEW --> APPROVED : Credit check & audit checks pass
    UNDER_REVIEW --> REJECTED : Audit fails / Risk threshold exceeded
    
    APPROVED --> [*]
    REJECTED --> [*]
```
