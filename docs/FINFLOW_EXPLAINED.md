# 🎓 FinFlow Technical Masterclass: The Complete Explanation

This document is your "Deep Dive" into every line of code and architectural decision in the FinFlow ecosystem. Use this to understand the **How** and the **Why** of your project.

---

## 🏗️ PART 1: THE BACKEND (Spring Boot Microservices)

Our backend is built using a **Distributed Microservices Architecture**. This means instead of one giant application, we have several small, specialized services.

### **1. API Gateway (The Entry Point)**
- **What it is:** The single entry point for all frontend requests.
- **Why we have it:** To centralize security. We don't want every microservice to have to handle authentication.
- **Key Logic:** It uses an `AuthenticationFilter` that intercepts every request, validates the JWT with the Auth service, and then forwards the request with user headers (`userRole`, `applicantId`).

### **2. Auth Service (Identity Provider)**
- **Responsibility:** User registration, Login, and JWT generation.
- **The Flow:** When you log in, it checks the MySQL database, verifies the hashed password with BCrypt, and uses a Secret Key to sign a JWT.
- **Tech Highlights:** Uses `Spring Security` and `io.jsonwebtoken` for secure token management.

### **3. Application Service (The Business Brain)**
- **Responsibility:** Managing the life of a loan application.
- **The Flow:** It handles the transition from `DRAFT` ➔ `SUBMITTED` ➔ `REVIEW`. 
- **Tech Highlights:** Uses **State-Machine Logic** to ensure an application can't jump from `DRAFT` to `APPROVED` without going through `REVIEW`.

### **4. Document Service (Secure Storage)**
- **Responsibility:** Linking physical files (PDFs) to loan applications.
- **Why it's separate:** File handling is heavy. By making it a separate service, it doesn't slow down the main application logic.
- **The Flow:** It stores file metadata in MySQL and provides secure download links only to authorized Admins.

### **5. Notification Service (Asynchronous Messenger)**
- **Responsibility:** Sending Emails and In-app alerts.
- **Why it's separate:** Sending an email can take seconds. If we did it in the main flow, the user would wait forever. 
- **The Flow:** It "listens" to a RabbitMQ queue. When a loan is submitted, a message drops into the queue, and this service picks it up and sends the email in the background.

---

## 🎨 PART 2: THE FRONTEND (React 19 & Redux)

Our frontend is a **Single Page Application (SPA)** designed for speed and a premium feel.

### **1. State Management (The Brain)**
- **Redux Toolkit:** We use "Slices" to manage data.
    - `authSlice`: Remembers if you're logged in and what your role is.
    - `applicationSlice`: Remembers what step of the 5-step wizard you are on.
- **Persistence:** We use `localStorage` so that if you refresh the page, you don't get logged out.

### **2. Component Architecture (The LEGO Blocks)**
- **Pages:** Large components like `Dashboard.jsx`, `AdminDashboard.jsx`, and `LoanApplication.jsx`.
- **Reusable Components:** Small parts like `Sidebar.jsx`, `NotificationDropdown.jsx`, and `ApplicationTimeline.jsx`.
- **Styling:** We use **Vanilla CSS** with CSS Variables (e.g., `--blue`, `--surface`). This makes it easy to change the "Theme" of the entire app in one click.

### **3. The API Layer (The Communication)**
- **Axios:** We use a centralized instance in `src/api/index.js`.
- **Interceptors (The Magic):**
    - **Request Interceptor:** Automatically adds the `Bearer <token>` to every request header.
    - **Response Interceptor:** If the backend says "Token Expired", it automatically tries to refresh the token and retries the request without the user knowing.

---

## ⚡ PART 3: CROSS-CUTTING CONCERNS

### **1. Messaging (RabbitMQ)**
- **Exchange/Queue:** We use a `Topic Exchange`.
- **Interconnection:** Services publish "Events" (e.g., `LOAN_SUBMITTED`). This makes the system "Reactive"—one change in the App service triggers a reaction in the Notification service automatically.

### **2. Persistence (Database Logic)**
- **MySQL:** Stores permanent records.
- **Redis:** Stores temporary data like OTPs (which expire in 5 minutes) and Session Cache.
- **Database-per-Service:** Each service has its own DB schema. This prevents "Spaghetti Data" where one service breaks another's tables.

### **3. Security (JWT)**
- **Statelessness:** The server doesn't remember you. Every time you make a request, you send your "ID Card" (JWT). 
- **Encryption:** We use **BCrypt** for passwords and **HS256** for token signatures.

---

## 🚀 SUMMARY FOR THE VIVA

If asked **"How does your system work?"**, answer like this:
> "FinFlow is a microservices ecosystem where the **API Gateway** acts as the secure entry point. Users authenticate via the **Auth Service** to get a JWT, which allows them to interact with the **Application Service** to manage loans. We use **RabbitMQ** for asynchronous notifications to keep the UI fast, and we use **React with Redux** to provide a seamless, real-time experience for both applicants and bank administrators."

**This is the complete technical DNA of your project.** Use it wisely!
