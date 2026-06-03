# 📊 FinFlow Design Diagrams

This document contains the design diagrams required for the project evaluation, covering the Use Case, Architecture, and Database diagrams.

---

## 1. Use Case Diagram
This diagram illustrates the interactions between the users (Applicant and Admin) and the FinFlow system.

```mermaid
graph TD
    subgraph Actors
        A[Applicant]
        AD[Admin / Loan Officer]
    end

    subgraph "FinFlow System"
        UC_Auth(Authentication & Login)
        UC_Submit(Submit Loan Application)
        UC_Upload(Upload Documents)
        UC_Track(Track Application Status)
        UC_Review(Review Applications)
        UC_Decision(Approve / Reject Loan)
        UC_Notify((System: Send Notification))
    end

    A --> UC_Auth
    A --> UC_Submit
    A --> UC_Upload
    A --> UC_Track

    AD --> UC_Auth
    AD --> UC_Review
    AD --> UC_Decision

    UC_Submit -.-> UC_Notify
    UC_Decision -.-> UC_Notify
```

---

## 2. System Architecture Diagram
This diagram shows the microservices architecture of FinFlow, including the API Gateway, service layer, messaging layer, and persistence layer.

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

## 3. Database Diagram (Logical ERD)
Since FinFlow follows a **Database-per-Service** pattern, these entities are managed by separate services but are logically related.

```mermaid
erDiagram
    %% Auth Service Database
    USER {
        Long id PK
        String username
        String email
        String password
        String role
    }

    %% Application Service Database
    LOAN_APPLICATION {
        Long id PK
        Long userId FK "Logical FK from Auth"
        String status
        Double requestedAmount
        String purpose
        DateTime submittedDate
    }

    %% Document Service Database
    DOCUMENT {
        Long id PK
        Long applicationId FK "Logical FK from App"
        String fileName
        String fileType
        String fileUrl
        String verificationStatus
    }

    %% Logical Relationships across microservices
    USER ||--o{ LOAN_APPLICATION : "applies for"
    LOAN_APPLICATION ||--o{ DOCUMENT : "includes"
```
