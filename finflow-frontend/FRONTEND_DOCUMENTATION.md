# 🎨 FinFlow Frontend - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Entry Point & Bootstrap Flow](#entry-point--bootstrap-flow)
5. [Routing System](#routing-system)
6. [Authentication & Protection](#authentication--protection)
7. [Pages & Components](#pages--components)
8. [State Management (Redux)](#state-management-redux)
9. [API Integration](#api-integration)
10. [Custom Hooks](#custom-hooks)
11. [Styling & Theme](#styling--theme)
12. [Data Flow Examples](#data-flow-examples)
13. [Dependencies](#dependencies)
14. [Getting Started](#getting-started)

---

## Project Overview

**FinFlow Frontend** is a modern React application built with:

- **Framework:** React 19.2.4
- **Build Tool:** Vite (Fast HMR development)
- **State Management:** Redux Toolkit
- **HTTP Client:** Axios
- **Routing:** React Router v7
- **Styling:** Tailwind CSS + PostCSS
- **UI Icons:** Lucide React

**Purpose:** Provide a user-friendly interface for:

- **Applicants:** Apply for loans, submit documents, track application status
- **Admins:** Review applications, manage users, generate reports
- **Public Users:** Access landing page, login, register, reset password

---

## Architecture

### High-Level Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER                              │
│  index.html (Root DOM)                                  │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                 main.jsx (Entry)                         │
│  - ReactDOM.createRoot()                                │
│  - Redux Provider (Global State)                        │
│  - ToastProvider (Global Notifications)                 │
│  - BrowserRouter (URL Navigation)                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   App.jsx (Root)                         │
│  - Theme initialization from localStorage               │
│  - Renders AppRouter                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│               AppRouter.jsx (Routes)                     │
│  - PUBLIC: Landing, Login, Signup, Password Reset       │
│  - PROTECTED: Applicant & Admin pages                   │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
   ┌──────────────┐   ┌────────────────────┐
   │ Public Pages │   │ Protected Pages    │
   │ (No Auth)    │   │ (ProtectedRoute)   │
   └──────────────┘   │ + DashboardLayout  │
                      │ (Sidebar + TopNav) │
                      └────────────────────┘
```

---

## Directory Structure

```
finflow-frontend/
│
├── 📄 Configuration Files
│   ├── package.json              # NPM dependencies & scripts
│   ├── vite.config.js            # Vite build configuration
│   ├── tailwind.config.js        # Tailwind CSS theme
│   ├── postcss.config.js         # CSS processing
│   ├── eslint.config.js          # Linting rules
│   └── index.html                # Main HTML entry point
│
├── 📁 public/                    # Static assets (images, fonts)
│
└── 📁 src/                       # Application source code
    │
    ├── 📄 main.jsx               # React app entry point
    ├── 📄 App.jsx                # Root component (theme)
    ├── 📄 index.css              # Global styles
    │
    ├── 📁 Routing/
    │   └── AppRouter.jsx         # Central route definitions
    │
    ├── 📁 Pages/                 # Full page components
    │   ├── Landing.jsx           # Home page (public)
    │   ├── Login.jsx             # Login page (public)
    │   ├── Signup.jsx            # Registration (public)
    │   ├── ForgotPassword.jsx    # Password reset request (public)
    │   ├── ResetPassword.jsx     # Set new password (public)
    │   ├── VerifyEmail.jsx       # Email verification (public)
    │   ├── Dashboard.jsx         # Applicant main page
    │   ├── LoanApplication.jsx   # Create/edit loan application
    │   ├── MyApplications.jsx    # View submitted applications
    │   ├── Documents.jsx         # Upload documents
    │   ├── TimelineHistory.jsx   # Track application progress
    │   ├── ProfileSettings.jsx   # User account settings
    │   ├── AdminDashboard.jsx    # Admin overview & stats
    │   └── Notifications.jsx     # View notifications
    │
    ├── 📁 Components/            # Reusable UI components
    │   ├── ProtectedRoute.jsx    # Auth & role check wrapper
    │   ├── Sidebar.jsx           # Navigation sidebar
    │   ├── ProfileDropdown.jsx   # User menu (profile, logout)
    │   ├── NotificationDropdown.jsx # Bell icon + notifications
    │   ├── ApplicationTimeline.jsx  # Status progress display
    │   ├── Toast.jsx             # Notification system
    │   └── *.css                 # Component-specific styles
    │
    ├── 📁 Layouts/               # Layout wrappers
    │   ├── DashboardLayout.jsx   # Main protected layout
    │   └── DashboardLayout.css   # Layout styles
    │
    ├── 📁 api/                   # API integration
    │   ├── index.js              # Axios client & interceptors
    │   ├── authService.js        # Auth API calls
    │   ├── applicationService.js # Loan application APIs
    │   ├── documentService.js    # Document APIs
    │   └── notificationService.js # Notification APIs
    │
    ├── 📁 store/                 # Redux state management
    │   ├── index.js              # Store configuration
    │   ├── authSlice.js          # Auth state & actions
    │   ├── applicationSlice.js   # Application state
    │   ├── notificationSlice.js  # Notification state
    │   └── themeSlice.js         # Theme state
    │
    ├── 📁 hooks/                 # Custom React hooks
    │   ├── useAuth.js            # Authentication logic
    │   └── useToast.js           # Toast notification logic
    │
    ├── 📁 utils/                 # Helper functions
    │   ├── format.js             # Date/currency formatting
    │   ├── validators.js         # Input validation
    │   ├── constants.js          # App constants
    │   └── storage.js            # localStorage utilities
    │
    └── 📁 assets/                # Static resources
        ├── images/
        ├── icons/
        └── fonts/
```

---

## Entry Point & Bootstrap Flow

### 1. **index.html** — HTML Shell

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>FinFlow - Loan Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### 2. **main.jsx** — React Initialization

**Purpose:** Bootstrap React with global providers

```javascript
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { store } from "./store";
import { ToastProvider } from "./Components/Toast.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* LAYER 1: Redux Global State */}
    <Provider store={store}>
      {/* LAYER 2: Global Toast Notifications */}
      <ToastProvider>
        {/* LAYER 3: URL Routing & Browser History */}
        <BrowserRouter>
          {/* LAYER 4: App Root */}
          <App />
        </BrowserRouter>
      </ToastProvider>
    </Provider>
  </React.StrictMode>,
);
```

**What Each Layer Does:**

- **Provider:** Makes Redux store accessible to all components
- **ToastProvider:** Context for global notifications
- **BrowserRouter:** Enables URL-based routing
- **App:** Root component that initializes theme

### 3. **App.jsx** — Root Component

**Purpose:** Initialize theme and render all routes

```javascript
import React, { useEffect } from "react";
import AppRouter from "./Routing/AppRouter";

function App() {
  useEffect(() => {
    // Load saved theme (default: dark)
    const savedTheme = localStorage.getItem("finflow_theme") || "dark";

    // Apply theme to <html> element
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <div className="app-container">
      <AppRouter />
    </div>
  );
}

export default App;
```

**Key Features:**

- Theme persistence across sessions
- Uses `data-theme` attribute for CSS-in-JS styling
- Delegates routing to AppRouter

---

## Routing System

### AppRouter.jsx — Route Configuration

**Purpose:** Define all application routes with authentication guards

```javascript
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../Components/ProtectedRoute";
import DashboardLayout from "../Layouts/DashboardLayout";

// Import all pages...

const AppRouter = () => {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* ========== APPLICANT PROTECTED ROUTES ========== */}
      <Route
        path="/applicant"
        element={
          <ProtectedRoute allowedRoles={["APPLICANT", "GUEST"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="apply" element={<LoanApplication />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="documents" element={<Documents />} />
        <Route path="history" element={<TimelineHistory />} />
        <Route path="settings" element={<ProfileSettings />} />
      </Route>

      {/* ========== ADMIN PROTECTED ROUTES ========== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        {/* More admin routes... */}
      </Route>

      {/* ========== FALLBACK ========== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
```

### Route Categories

#### **Public Routes** (No Authentication Required)

```
GET  /                    → Landing (marketing page)
GET  /login              → Login form
GET  /signup             → Registration form
GET  /forgot-password    → Password recovery
GET  /reset-password     → Set new password
GET  /verify-email       → Email confirmation
```

#### **Applicant Routes** (Role: APPLICANT)

```
GET  /applicant/dashboard       → Main dashboard
GET  /applicant/apply           → Create loan application
GET  /applicant/applications    → View submitted loans
GET  /applicant/documents       → Upload documents
GET  /applicant/history         → Track progress
GET  /applicant/settings        → Profile settings
```

#### **Admin Routes** (Role: ADMIN)

```
GET  /admin/dashboard           → Admin overview
GET  /admin/applications        → Manage applications
GET  /admin/users               → User management
GET  /admin/fraud-detection     → Fraud audit
GET  /admin/analytics           → Reports
```

---

## Authentication & Protection

### ProtectedRoute.jsx — Gatekeeper Component

**Purpose:** Enforce authentication and authorization before rendering pages

```javascript
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, loading } = useSelector(
    (state) => state.auth,
  );
  const location = useLocation();

  // STEP 1: Check if auth is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // STEP 2: Check if user is authenticated
  if (!isAuthenticated) {
    // Save the location they tried to access for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // STEP 3: Check if user has required role
  if (allowedRoles.length > 0) {
    const normalizedUserRole = userRole?.replace("ROLE_", "");
    const isAllowed = allowedRoles.some(
      (role) => role.replace("ROLE_", "") === normalizedUserRole,
    );

    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  // STEP 4: All checks passed, render children
  return children;
};

export default ProtectedRoute;
```

**Flow:**

```
User visits /applicant/dashboard
         ↓
ProtectedRoute checks loading?
         ↓ No (loading finished)
ProtectedRoute checks isAuthenticated?
         ↓ Yes (JWT exists)
ProtectedRoute checks allowedRoles includes userRole?
         ↓ Yes (APPLICANT is allowed)
         ↓
Dashboard renders ✓
```

---

## Pages & Components

### Pages (Full Screen Components)

| Page                 | Path                      | File                | Role      | Purpose                  |
| -------------------- | ------------------------- | ------------------- | --------- | ------------------------ |
| **Landing**          | `/`                       | Landing.jsx         | PUBLIC    | Marketing home page      |
| **Login**            | `/login`                  | Login.jsx           | PUBLIC    | User authentication      |
| **Signup**           | `/signup`                 | Signup.jsx          | PUBLIC    | New user registration    |
| **Forgot Password**  | `/forgot-password`        | ForgotPassword.jsx  | PUBLIC    | Request password reset   |
| **Reset Password**   | `/reset-password`         | ResetPassword.jsx   | PUBLIC    | Set new password         |
| **Verify Email**     | `/verify-email`           | VerifyEmail.jsx     | PUBLIC    | Confirm email address    |
| **Dashboard**        | `/applicant/dashboard`    | Dashboard.jsx       | APPLICANT | Applicant home + stats   |
| **Loan Application** | `/applicant/apply`        | LoanApplication.jsx | APPLICANT | Create/edit loan form    |
| **My Applications**  | `/applicant/applications` | MyApplications.jsx  | APPLICANT | View submitted loans     |
| **Documents**        | `/applicant/documents`    | Documents.jsx       | APPLICANT | Upload documents         |
| **Timeline**         | `/applicant/history`      | TimelineHistory.jsx | APPLICANT | Track application status |
| **Profile Settings** | `/applicant/settings`     | ProfileSettings.jsx | APPLICANT | Account settings         |
| **Admin Dashboard**  | `/admin/dashboard`        | AdminDashboard.jsx  | ADMIN     | Admin overview           |
| **Notifications**    | `/notifications`          | Notifications.jsx   | APPLICANT | View all notifications   |

### Reusable Components

#### **ProtectedRoute.jsx**

- Wraps pages to enforce authentication
- Checks JWT token validity
- Checks user role authorization
- Redirects to login if unauthenticated

#### **Sidebar.jsx**

```javascript
Purpose: Main navigation menu

Applicant Menu:
├── Dashboard
├── New Application
├── Applications
├── Documents
├── Timeline
└── Settings

Admin Menu:
├── Overview
├── Applications
├── Users
├── Fraud Audit
├── Analytics
└── Settings

Features:
- Responsive (collapses on mobile)
- Active link highlighting
- Status indicator for applicants
- Dark/Light mode toggle
```

#### **DashboardLayout.jsx**

```javascript
Purpose: Persistent layout for protected pages

Structure:
┌─────────────────────────────────────┐
│ TopNav                              │
│ [Menu] [Logo] | [Notifications] [Profile]
├──────────────┬──────────────────────┤
│              │                      │
│  Sidebar     │  Outlet (Page)       │
│              │  (Dashboard,         │
│              │   Applications, etc) │
│              │                      │
└──────────────┴──────────────────────┘

Features:
- Persistent navigation across page changes
- Theme toggle (Light/Dark mode)
- Mobile-responsive
- Logout button
```

#### **ProfileDropdown.jsx**

```javascript
Purpose: User account menu

Options:
├── View Profile
├── Edit Settings
├── Help & Support
└── Logout

Features:
- Shows current user name
- Logout clears Redux + localStorage
- Navigate to /login after logout
```

#### **NotificationDropdown.jsx**

```javascript
Purpose: Show recent notifications

Features:
- Bell icon with unread count badge
- Click to open notification dropdown
- List of recent notifications
- "View All" link to Notifications page
- Mark as read functionality
```

#### **ApplicationTimeline.jsx**

```javascript
Purpose: Visual progress tracker

Stages:
Submitted → Review → Approved/Rejected

Features:
- Shows current status
- Timeline of updates
- Dates & notes for each stage
```

#### **Toast.jsx**

```javascript
Purpose: Global notification system

Types:
├── success (green)
├── error (red)
├── warning (yellow)
└── info (blue)

Usage:
const { showToast } = useToast();
showToast('Loan submitted!', 'success');
```

---

## State Management (Redux)

### Store Configuration

**Purpose:** Centralize application state (auth, applications, notifications, etc.)

```javascript
// store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import applicationReducer from "./applicationSlice";
import notificationReducer from "./notificationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationReducer,
    notifications: notificationReducer,
  },
});
```

### State Slices

#### **authSlice.js** — Authentication State

```javascript
State Shape:
{
  auth: {
    isAuthenticated: boolean,      // JWT token exists
    userRole: string,              // 'APPLICANT' | 'ADMIN'
    user: {
      id: string,
      name: string,
      email: string,
      phone: string,
    },
    token: string,                 // JWT token
    loading: boolean,              // Auth initializing
    error: string | null,          // Error message
  }
}

Actions:
├── setAuth({user, role, token})   // Set user after login
├── logout()                        // Clear user + token
├── setLoading(boolean)             // Set loading state
├── setError(message)               // Set error message
└── refreshToken(newToken)          // Update token

Usage in Components:
const { isAuthenticated, userRole } = useSelector(state => state.auth);
const dispatch = useDispatch();
dispatch(logout());
```

#### **applicationSlice.js** — Loan Applications State

```javascript
State Shape:
{
  applications: {
    items: [
      {
        id: string,
        title: string,
        status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED',
        loanAmount: number,
        loanType: string,
        createdAt: date,
        updatedAt: date,
      }
    ],
    selectedApplication: null,
    loading: boolean,
    error: string | null,
  }
}

Actions:
├── fetchApplications()             // Get all applications
├── fetchApplicationById(id)        // Get single application
├── createApplication(data)         // Create new application
├── updateApplication({id, data})   // Update application
├── deleteApplication(id)           // Delete application
└── setSelectedApplication(app)     // Set current viewed app

Usage:
const applications = useSelector(state => state.applications.items);
dispatch(fetchApplications());
```

#### **notificationSlice.js** — Notifications State

```javascript
State Shape:
{
  notifications: {
    items: [
      {
        id: string,
        title: string,
        message: string,
        type: 'info' | 'success' | 'warning' | 'error',
        isRead: boolean,
        createdAt: date,
      }
    ],
    unreadCount: number,
    loading: boolean,
  }
}

Actions:
├── fetchNotifications()            // Get all notifications
├── markAsRead(notificationId)      // Mark single as read
├── markAllAsRead()                 // Mark all as read
├── deleteNotification(id)          // Delete notification
└── clearNotifications()            // Clear all

Usage:
const { items, unreadCount } = useSelector(state => state.notifications);
dispatch(fetchNotifications());
```

---

## API Integration

### api/index.js — Global Axios Client

**Purpose:** Centralized HTTP requests with interceptors for:

- JWT authentication
- Token refresh on expiry
- Error handling
- Request idempotency

```javascript
import axios from "axios";

// ========== CONFIGURATION ==========
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ========== REQUEST INTERCEPTOR ==========
// Runs BEFORE sending request
client.interceptors.request.use((config) => {
  // 1. Attach JWT token from localStorage
  const token = localStorage.getItem("finflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Add user context headers
  const role = localStorage.getItem("finflow_role");
  const applicantId = localStorage.getItem("finflow_applicantId");
  if (role) config.headers["X-User-Role"] = role;
  if (applicantId) config.headers["X-Applicant-Id"] = applicantId;

  // 3. Add idempotency key (prevent duplicate operations)
  if (["post", "patch", "delete"].includes(config.method)) {
    config.headers["Idempotency-Key"] = `${Date.now()}-${Math.random()}`;
  }

  return config;
});

// ========== RESPONSE INTERCEPTOR ==========
// Runs AFTER receiving response
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 (Unauthorized), try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post("/api/auth/refresh", {
          token: localStorage.getItem("finflow_token"),
        });

        const newToken = response.data.token;
        localStorage.setItem("finflow_token", newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default client;
```

### Service APIs

#### **authService.js**

```javascript
export const authService = {
  login: (email, password) => client.post("/auth/login", { email, password }),

  signup: (name, email, password) =>
    client.post("/auth/signup", { name, email, password }),

  logout: () => client.post("/auth/logout"),

  refreshToken: () => client.post("/auth/refresh"),

  verifyEmail: (token) => client.post("/auth/verify-email", { token }),

  resetPassword: (token, newPassword) =>
    client.post("/auth/reset-password", { token, newPassword }),
};
```

#### **applicationService.js**

```javascript
export const applicationService = {
  getAll: (filters) => client.get("/applications", { params: filters }),

  getById: (id) => client.get(`/applications/${id}`),

  getStatus: () => client.get("/applications/status"),

  create: (data) => client.post("/applications", data),

  update: (id, data) => client.patch(`/applications/${id}`, data),

  submit: (id) => client.post(`/applications/${id}/submit`),

  delete: (id) => client.delete(`/applications/${id}`),
};
```

#### **documentService.js**

```javascript
export const documentService = {
  upload: (applicationId, file, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    return client.post(`/documents/upload/${applicationId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getByApplication: (applicationId) =>
    client.get(`/documents/application/${applicationId}`),

  download: (documentId) =>
    client.get(`/documents/download/${documentId}`, { responseType: "blob" }),

  delete: (documentId) => client.delete(`/documents/${documentId}`),
};
```

#### **notificationService.js**

```javascript
export const notificationService = {
  getAll: () => client.get("/notifications"),

  markAsRead: (notificationId) =>
    client.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () => client.put("/notifications/read-all"),

  delete: (notificationId) => client.delete(`/notifications/${notificationId}`),
};
```

---

## Custom Hooks

### useAuth.js — Authentication Logic

**Purpose:** Simplify authentication operations in components

```javascript
import { useDispatch, useSelector } from "react-redux";
import { setAuth, logout } from "../store/authSlice";
import authService from "../api/authService";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, userRole, user, loading } = useSelector(
    (state) => state.auth,
  );

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { token, user, role } = response.data;

      // Save to localStorage
      localStorage.setItem("finflow_token", token);
      localStorage.setItem("finflow_role", role);
      localStorage.setItem("finflow_userId", user.id);

      // Save to Redux
      dispatch(setAuth({ user, role, token }));
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      // Clear localStorage
      localStorage.removeItem("finflow_token");
      localStorage.removeItem("finflow_role");
      localStorage.removeItem("finflow_userId");

      // Clear Redux
      dispatch(logout());
    }
  };

  return {
    isAuthenticated,
    userRole,
    user,
    loading,
    login,
    logout,
  };
};
```

**Usage in Components:**

```javascript
const MyComponent = () => {
  const { isAuthenticated, user, login, logout } = useAuth();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) navigate("/applicant/dashboard");
  };

  return (
    <div>
      {isAuthenticated ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
};
```

### useToast.js — Notification Hook

**Purpose:** Show toast notifications globally

```javascript
import { useContext } from "react";
import { ToastContext } from "../Components/Toast";

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
};
```

**Usage:**

```javascript
const MyComponent = () => {
  const { showToast } = useToast();

  const handleSubmit = async () => {
    try {
      await submitLoan(data);
      showToast("Loan submitted successfully!", "success");
    } catch (error) {
      showToast("Failed to submit loan", "error");
    }
  };

  return <button onClick={handleSubmit}>Submit</button>;
};
```

**Toast Types:**

- `success` — Green notification (operations completed)
- `error` — Red notification (something went wrong)
- `warning` — Yellow notification (caution needed)
- `info` — Blue notification (informational)

---

## Styling & Theme

### Tailwind CSS Setup

**tailwind.config.js:**

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6", // Blue
        secondary: "#10b981", // Green
        danger: "#ef4444", // Red
        warning: "#f59e0b", // Amber
        dark: "#1f2937",
        light: "#f9fafb",
      },
      spacing: {
        // Custom spacing
      },
    },
  },
  plugins: [],
};
```

### Theme Switching (Light/Dark Mode)

**Implementation:**

1. Store theme preference in localStorage
2. Apply `data-theme` attribute to `<html>`
3. Use CSS variables for theme colors

**App.jsx:**

```javascript
useEffect(() => {
  const savedTheme = localStorage.getItem("finflow_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
}, []);
```

**DashboardLayout.jsx:**

```javascript
const toggleTheme = () => {
  const newTheme = theme === "dark" ? "light" : "dark";
  setTheme(newTheme);
  localStorage.setItem("finflow_theme", newTheme);
  document.documentElement.setAttribute("data-theme", newTheme);
};
```

**index.css:**

```css
:root[data-theme="dark"] {
  --bg-primary: #1f2937;
  --text-primary: #f9fafb;
  --border-color: #374151;
}

:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
  --border-color: #e5e7eb;
}

body {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}
```

### CSS Organization

```
├── index.css                    # Global styles
├── Components/
│   ├── Sidebar.css              # Sidebar styles
│   ├── ApplicationTimeline.css  # Timeline styles
│   └── *.css                    # Component-specific
└── Pages/
    ├── Dashboard.css
    ├── LoanApplication.css
    └── *.css
```

---

## Data Flow Examples

### Example 1: User Login Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. User Visits /login                               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. Login.jsx renders                                │
│    - Email & password input fields                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. User enters credentials & clicks "Login"         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. useAuth().login(email, password)                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 5. authService.login() calls API                    │
│    POST /api/auth/login                             │
│    (axios request interceptor adds headers)         │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 6. Backend validates credentials                    │
│    Returns: { token, user, role }                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 7. Save to localStorage:                            │
│    - finflow_token (JWT)                            │
│    - finflow_role (APPLICANT)                       │
│    - finflow_userId (user ID)                       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 8. Dispatch Redux action: setAuth()                 │
│    - state.auth.isAuthenticated = true              │
│    - state.auth.userRole = 'APPLICANT'              │
│    - state.auth.user = user object                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 9. Navigate to /applicant/dashboard                 │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 10. ProtectedRoute checks:                          │
│     ✓ isAuthenticated = true                        │
│     ✓ userRole ('APPLICANT') in allowedRoles       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 11. Dashboard renders ✓                             │
└─────────────────────────────────────────────────────┘
```

### Example 2: Create Loan Application Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. Applicant visits /applicant/apply                │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. LoanApplication.jsx renders form                 │
│    (ProtectedRoute already verified auth)           │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. User fills form:                                 │
│    - Loan amount                                    │
│    - Loan type                                      │
│    - Purpose                                        │
│    - Personal info                                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. User clicks "Save as Draft" or "Submit"          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 5. Validate form locally (useValidator hook)        │
│    If invalid: showToast('error', 'Invalid fields')│
│    If valid: continue                               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 6. Call applicationService.create(data)             │
│    POST /api/applications                           │
│    Headers:                                         │
│    - Authorization: Bearer {JWT token}              │
│    - X-User-Role: APPLICANT                        │
│    - Idempotency-Key: {unique key}                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 7. Backend receives request:                        │
│    - Validates JWT token                            │
│    - Validates application data                     │
│    - Saves to database                              │
│    - Returns: { id, status: 'DRAFT', ... }          │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 8. Dispatch Redux action: createApplication()       │
│    - Add new app to state.applications.items        │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 9. Show success toast:                              │
│    showToast('Application saved!', 'success')       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 10. Navigate to /applicant/applications             │
│     (show newly created app in list)                │
└─────────────────────────────────────────────────────┘
```

### Example 3: Admin Reviews Loan Application

```
┌─────────────────────────────────────────────────────┐
│ 1. Admin logs in (same as user login flow)          │
│    Role set to: ADMIN                               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 2. Navigate to /admin/dashboard                     │
│    ProtectedRoute verifies: userRole == 'ADMIN' ✓   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 3. AdminDashboard.jsx renders                       │
│    - Shows pending applications count               │
│    - Shows recent submissions                       │
│    - Shows fraud risk warnings                      │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 4. Admin clicks on an application                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 5. Call applicationService.getById(appId)           │
│    GET /api/applications/{appId}                    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 6. Display application details:                     │
│    - Applicant info                                 │
│    - Loan details                                   │
│    - Documents (links to download)                  │
│    - Previous notes from other admins               │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 7. Admin reviews and clicks "Approve" or "Reject"   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 8. Call applicationService.update(appId, {          │
│     status: 'APPROVED',                             │
│     notes: 'Admin comments',                        │
│   })                                                │
│    PATCH /api/applications/{appId}                  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 9. Backend:                                         │
│    - Updates application status                     │
│    - Triggers RabbitMQ event: APPLICATION_APPROVED  │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 10. Notification-Service consumes event             │
│     - Sends email to applicant: "Loan Approved!"    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 11. Update Redux state                              │
│     - Change application status to 'APPROVED'       │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│ 12. Show toast: "Application approved!"             │
│     UI refreshes to show updated status             │
└─────────────────────────────────────────────────────┘
```

---

## Dependencies

### Core Dependencies

| Package              | Version | Purpose                 |
| -------------------- | ------- | ----------------------- |
| **react**            | 19.2.4  | UI library              |
| **react-dom**        | 19.2.4  | DOM rendering           |
| **react-router-dom** | 7.14.1  | Page routing            |
| **@reduxjs/toolkit** | 2.11.2  | State management        |
| **react-redux**      | 9.2.0   | Redux integration       |
| **axios**            | 1.15.2  | HTTP client             |
| **tailwindcss**      | 4.2.2   | CSS framework           |
| **lucide-react**     | 1.8.0   | Icon library            |
| **date-fns**         | 4.1.0   | Date formatting         |
| **jwt-decode**       | 4.0.0   | JWT decoding            |
| **framer-motion**    | 12.38.0 | Animations              |
| **clsx**             | 2.1.1   | Conditional CSS classes |
| **tailwind-merge**   | 3.5.0   | Merge Tailwind classes  |

### Dev Dependencies

| Package                  | Purpose                 |
| ------------------------ | ----------------------- |
| **vite**                 | Build tool & dev server |
| **@vitejs/plugin-react** | React support for Vite  |
| **eslint**               | Code linting            |
| **postcss**              | CSS processing          |
| **autoprefixer**         | CSS vendor prefixes     |
| **@tailwindcss/postcss** | Tailwind PostCSS plugin |

---

## Getting Started

### Prerequisites

- Node.js 16+ with npm
- Backend running on http://localhost:8080

### Installation

```bash
# Navigate to frontend directory
cd finflow-frontend

# Install dependencies
npm install

# Create .env file (if needed)
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8080/api
EOF
```

### Development

```bash
# Start dev server (HMR enabled)
npm run dev

# Server runs at: http://localhost:5173
# Auto-opens browser and reloads on file changes
```

### Production Build

```bash
# Create optimized bundle
npm run build

# Output in: dist/

# Preview production build
npm run preview
```

### Linting

```bash
# Check code quality
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## Testing & Debugging

### Development Tips

1. **Redux DevTools**: Install browser extension to inspect state
2. **Network Tab**: Check API calls and responses
3. **Console Logs**: Check for errors or warnings
4. **localStorage**: Open DevTools → Application → Local Storage

### Common Issues

| Issue                                 | Solution                                           |
| ------------------------------------- | -------------------------------------------------- |
| **401 Unauthorized**                  | Token expired → Login again or check token refresh |
| **CORS Error**                        | Backend not running or wrong URL in .env           |
| **Page blank**                        | Check browser console for JS errors                |
| **Theme not switching**               | Clear localStorage, refresh page                   |
| **ProtectedRoute redirects to login** | Check JWT token in localStorage                    |

---

## Deployment

### Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized files ready for deployment.

### Deploy Options

1. **Vercel** (Recommended for React)

   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**

   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

3. **Traditional Server** (Apache, Nginx)
   - Copy `dist/` contents to server
   - Configure server to serve `index.html` for all routes (SPA routing)

### Environment Variables for Production

Create `.env.production`:

```
VITE_API_BASE_URL=https://api.finflow.com/api
```

---

## Summary

The FinFlow Frontend is a **modern, scalable React application** built with:

- ✅ **Component-based architecture** for reusability
- ✅ **Redux state management** for predictable data flow
- ✅ **Axios interceptors** for automatic JWT handling
- ✅ **Role-based access control** via ProtectedRoute
- ✅ **Responsive design** with Tailwind CSS
- ✅ **Dark/Light mode** support
- ✅ **Global notifications** system
- ✅ **Fast development** with Vite HMR

This structure ensures **maintainability**, **scalability**, and **user experience** for both applicants and administrators.

---

**Good luck with your viva! You're well-prepared now!** 🎓
