# 📊 FinFlow Design Diagrams

This document contains the core structural and behavioral diagrams for the FinFlow Loan Management System.

---

## 1. Use Case Diagram
Illustrates the interactions between the primary users (Applicant and Underwriter/Admin) and the core capabilities of the system.

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
        UC_Review(Review Application Dossier)
        UC_Decision(Approve / Reject Loan)
    end

    A --> UC_Auth
    A --> UC_Submit
    A --> UC_Upload
    A --> UC_Track

    AD --> UC_Auth
    AD --> UC_Review
    AD --> UC_Decision
```

---

## 2. System Architecture Diagram
Shows the microservices layout, edge gateway routing, discovery registry, messaging queue, and isolated databases.

```mermaid
graph TD
    Client[React Frontend] -->|REST| Gateway[API Gateway :8080]
    
    subgraph "Service Infrastructure"
        Eureka[Eureka Server :8761]
        Config[Config Server :8889]
    end
    
    subgraph "Core Microservices"
        Gateway --> Auth[Auth Service :8081]
        Gateway --> App[Application Service :8082]
        Gateway --> Admin[Admin Service :8083]
        Gateway --> Doc[Document Service :8084]
    end
    
    subgraph "Messaging & Alerts"
        App --> Rabbit[RabbitMQ]
        Rabbit --> Notif[Notification Service :8085]
    end
    
    subgraph "Databases"
        Auth --- AuthDB[(MySQL + Redis)]
        App --- AppDB[(MySQL)]
        Admin --- AdminDB[(MySQL)]
        Doc --- DocDB[(MySQL)]
    end
    
    Auth & App & Admin & Doc -.-> Eureka
    Auth & App & Admin & Doc -.-> Config
```

---

## 3. Database ERD (Logical)
FinFlow uses a **Database-per-Service** pattern. Each service owns its database, and links are managed logically in the code using reference IDs.

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
        String status
        Double requestedAmount
        String purpose
        DateTime submittedAt
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
    }

    USER ||--o{ LOAN_APPLICATION : "submits"
    LOAN_APPLICATION ||--o{ LOAN_DOCUMENT : "contains"
    LOAN_APPLICATION ||--o{ UNDERWRITING_AUDIT : "reviewed_by"
```

---

## 4. Loan Application State Machine
Represents the strict lifecycle transitions that a loan application undergoes from creation to decision.

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Create Application
    DRAFT --> SUBMITTED : Submit
    SUBMITTED --> UNDER_REVIEW : Open for Review
    UNDER_REVIEW --> HOLD : Request re-upload
    HOLD --> UNDER_REVIEW : Re-uploaded
    UNDER_REVIEW --> APPROVED : Approved
    UNDER_REVIEW --> REJECTED : Rejected
    APPROVED --> [*]
    REJECTED --> [*]
```
