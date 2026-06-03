# 📊 FinFlow Design Diagrams

This document contains the structural and behavioral design diagrams for the FinFlow Loan Management System, illustrating both high-level architecture and detailed sequence flows.

---

## 1. Use Case Diagram
Illustrates the interactions between the actors (Applicant, Underwriter/Admin) and the boundaries of the system.

```mermaid
graph TD
    subgraph Actors
        A[Applicant]
        AD[Underwriter / Admin]
    end

    subgraph "FinFlow System"
        UC_Auth(Register & Login)
        UC_Submit(Submit Loan Application)
        UC_Upload(Upload KYC Documents)
        UC_Track(Track Application Status)
        UC_Review(Review Applications)
        UC_Decision(Approve / Reject Loan)
        UC_Hold(Place / Release Holds)
    end

    A --> UC_Auth
    A --> UC_Submit
    A --> UC_Upload
    A --> UC_Track

    AD --> UC_Auth
    AD --> UC_Review
    AD --> UC_Decision
    AD --> UC_Hold
```

---

## 2. Microservices Architecture
Shows the service layout, gateway routing, Eureka registry, Config server, RabbitMQ message broker, and databases.

```mermaid
graph TD
    Client[React Frontend] -->|REST| Gateway[API Gateway :8080]
    
    subgraph "Service Infrastructure"
        Eureka[Eureka Registry :8761]
        Config[Config Server :8889]
    end
    
    subgraph "Core Microservices"
        Gateway --> Auth[Auth Service :8081]
        Gateway --> App[Application Service :8082]
        Gateway --> Admin[Admin Service :8083]
        Gateway --> Doc[Document Service :8084]
    end
    
    subgraph "Messaging Layer"
        App --> Rabbit[RabbitMQ Broker]
        Admin --> Rabbit
        Rabbit --> Notif[Notification Service :8085]
    end
    
    subgraph "Persistence"
        Auth --- AuthDB[(MySQL + Redis)]
        App --- AppDB[(MySQL)]
        Admin --- AdminDB[(MySQL)]
        Doc --- DocDB[(MySQL)]
    end
    
    Auth & App & Admin & Doc -.-> Eureka
    Auth & App & Admin & Doc -.-> Config
```

---

## 3. Database ERD (Logical Schema)
FinFlow follows a **Database-per-Service** model. Relationships across services are mapped logically via reference IDs.

```mermaid
erDiagram
    USER {
        Long id PK
        String email UK
        String password
        String role
    }

    LOAN_APPLICATION {
        Long id PK
        Long applicantId FK "Logical reference to USER"
        String status "DRAFT, SUBMITTED, APPROVED, REJECTED, HOLD"
        Double requestedAmount
        String purpose
        DateTime submittedAt
    }

    EMPLOYMENT_DETAILS {
        Long id PK
        Long applicationId FK
        String employerName
        Double monthlyIncome
    }

    LOAN_DOCUMENT {
        Long id PK
        Long applicationId FK "Logical reference to LOAN_APPLICATION"
        String fileName
        String documentType "AADHAAR, PAN, SALARY_SLIP, etc."
    }

    UNDERWRITING_AUDIT {
        Long id PK
        Long applicationId FK "Logical reference to LOAN_APPLICATION"
        String decision "APPROVED, REJECTED"
        String remarks
        DateTime auditedAt
    }

    USER ||--o{ LOAN_APPLICATION : "submits"
    LOAN_APPLICATION ||--|| EMPLOYMENT_DETAILS : "requires"
    LOAN_APPLICATION ||--o{ LOAN_DOCUMENT : "contains"
    LOAN_APPLICATION ||--o{ UNDERWRITING_AUDIT : "reviewed_by"
```

---

## 4. End-to-End Loan Flow (Sequence Diagram)
Details the step-by-step HTTP requests, routing, event publishing, and DB logs when an applicant submits a loan and an admin decisions it.

```mermaid
sequenceDiagram
    autonumber
    actor Applicant as Applicant
    participant UI as React UI
    participant GW as API Gateway
    participant Auth as Auth Service
    participant App as Application Service
    participant Doc as Document Service
    participant Rabbit as RabbitMQ
    participant Notif as Notification Service

    %% Create Draft & Upload
    Applicant->>UI: Fills Wizard Step 1
    UI->>GW: POST /api/applications (Draft)
    GW->>App: Route to /applications
    App->>App: Save Application Draft
    App-->>UI: Return Draft ID (101)

    %% Document Upload
    Applicant->>UI: Uploads KYC Files
    UI->>GW: POST /api/documents/upload-all
    GW->>Doc: Route to /documents
    Doc->>App: REST call to verify owner
    App-->>Doc: Owner verified
    Doc->>Doc: Save file BLOBs in DB
    Doc-->>UI: Upload successful

    %% Submission
    Applicant->>UI: Submits Application
    UI->>GW: PATCH /api/applications/submit
    GW->>App: Route to /applications/submit
    App->>App: Change state to SUBMITTED
    App->>Rabbit: Publish event (loan.submitted)
    App-->>UI: Submission confirmed
    
    %% Async Notification
    Rabbit->>Notif: Deliver event
    Notif->>Notif: Render email template
    Notif->>Applicant: Send confirmation email
```

---

## 5. Loan Application State Machine
Represents the allowed transitions of a loan application status.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Application
    DRAFT --> SUBMITTED : Submit Application
    SUBMITTED --> UNDER_REVIEW : Open for Underwriting
    UNDER_REVIEW --> HOLD : Request document re-upload
    HOLD --> UNDER_REVIEW : Re-upload completed
    UNDER_REVIEW --> APPROVED : Credit check & audit pass
    UNDER_REVIEW --> REJECTED : Risk check failed
    APPROVED --> [*]
    REJECTED --> [*]
```
