# 🎨 FinFlow Frontend | Technical Documentation

The FinFlow Frontend is a modern React application built for high performance and premium user experience. It serves as the unified interface for both loan applicants and administrative underwriters.

---

## 🏗️ Technical Architecture

### **1. Component Philosophy**
- **Modular Design**: UI elements are built as independent, reusable components located in `src/Components`.
- **Atomic Views**: Full-page layouts and domain logic are encapsulated in `src/Pages`.
- **Premium Aesthetics**: Styles are managed via localized CSS with a focus on dark mode, glassmorphism, and responsive layouts.

### **2. State Management**
- **Global Context**: Managed via **Redux Toolkit** for predictable state transitions.
- **Auth Persistence**: The `authSlice` synchronizes user identity and JWTs with `localStorage` to ensure session persistence across reloads.
- **Dynamic UI**: Framer Motion is utilized for high-fidelity transitions and micro-animations.

### **3. Communication & Resilience**
- **Service Layer**: API calls are abstracted into domain-specific services (Auth, Application, Document, Admin).
- **Interceptor Logic**: Custom Axios interceptors handle:
    - **Header Injection**: Attaching JWTs and contextual metadata.
    - **Token Refresh**: Automatic handling of `401 Unauthorized` errors to silently refresh sessions.
    - **Idempotency**: Injecting unique keys for mutation requests.

---

## 🛠️ Technology Stack
- **Framework**: React 19
- **Build Tool**: Vite
- **State**: Redux Toolkit & React-Redux
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## 📂 Project Structure

| Path | Description |
| :--- | :--- |
| **`src/api`** | Domain-driven API service definitions. |
| **`src/Components`** | Shared UI components and widgets. |
| **`src/Pages`** | Primary application views and route handlers. |
| **`src/store`** | Redux slices and store configuration. |
| **`src/hooks`** | Custom React hooks for auth, notifications, and UI state. |
| **`src/utils`** | Formatting, validation, and common helper functions. |

---

## 🚀 Development Setup

### **1. Install Dependencies**
```bash
npm install
```

### **2. Local Development**
```bash
npm run dev
```
*Access the development environment at [http://localhost:5173](http://localhost:5173).*

### **3. Build for Production**
```bash
npm run build
```

---
**FinFlow Frontend** | Part of the Enterprise Loan Management Ecosystem
