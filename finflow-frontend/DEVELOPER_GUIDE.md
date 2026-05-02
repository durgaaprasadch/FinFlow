# 🚀 FinFlow Frontend - Developer Quick Start

## Prerequisites

- Node.js 16+
- npm or yarn
- Backend running (Gateway at 8080)

## Installation

```bash
cd finflow-frontend
npm install
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Access at: `http://localhost:5173`

### Build Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

---

## 📂 Key Files to Know

| File                   | Purpose                         |
| ---------------------- | ------------------------------- |
| `src/api/index.js`     | Axios client + service layer    |
| `src/store/index.js`   | Redux store configuration       |
| `src/App.jsx`          | Router & protected routes       |
| `src/hooks/useAuth.js` | Authentication hook             |
| `.env`                 | Environment variables (API URL) |

---

## 🔑 API Endpoints

### Authentication

```
POST   /auth/signup/{role}              - Register user
POST   /auth/signup/verify              - Verify OTP
POST   /auth/login                      - Login
POST   /auth/login/verify               - Verify 2FA
POST   /auth/forgot-password            - Reset request
POST   /auth/verify-otp                 - Verify reset OTP
POST   /auth/reset-password             - Complete reset
POST   /auth/refresh                    - Refresh token
```

### Loan Applications

```
POST   /applications                    - Create draft
PATCH  /applications/personal           - Update personal
PATCH  /applications/employment         - Update employment
PATCH  /applications/loan               - Update loan details
PATCH  /applications/submit             - Submit application
GET    /applications/status             - Get current status
GET    /applications/history            - Get history
DELETE /applications/draft              - Delete draft
```

### Documents

```
POST   /v1/documents/upload-all         - Upload all documents
```

---

## 🎨 Component Usage Examples

### Using Redux for Loan Application

```jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  createLoanApplication,
  submitApplication
} from '../store/applicationActions';
import { updateFormField, nextStep } from '../store/applicationSlice_new';

export function MyComponent() {
  const dispatch = useDispatch();
  const { formData, currentStep, loading } = useSelector(state => state.application);

  const handleCreateDraft = () => {
    dispatch(createLoanApplication({
      loanType: 'PERSONAL',
      requestedAmount: 500000
    }));
  };

  const handleUpdateField = (field, value) => {
    dispatch(updateFormField({ field, value }));
  };

  const handleNext = () => {
    dispatch(nextStep());
  };

  return (
    // Your component JSX
  );
}
```

### Using Authentication

```jsx
import useAuth from "../hooks/useAuth";

export function MyComponent() {
  const { isAuthenticated, userRole, user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user}!</p>}
      <p>Role: {userRole}</p>
    </div>
  );
}
```

### Using API Services

```jsx
import { applicationService } from "../api";

async function fetchStatus() {
  try {
    const response = await applicationService.getStatus();
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}
```

---

## 🎯 Common Tasks

### Add a New Page

1. Create file in `src/pages/MyPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in layout

### Add a New Redux Action

1. Create async thunk in `src/store/myActions.js`
2. Add cases in `src/store/mySlice.js`
3. Import and dispatch in components

### Add a New Component

1. Create in `src/components/MyComponent.jsx`
2. Add styles in `src/components/MyComponent.css`
3. Import and use in pages/components

---

## 🔍 Debugging Tips

### Redux State

```javascript
// In browser console
localStorage.getItem("finflow_token"); // Check JWT
localStorage.getItem("finflow_role"); // Check role
```

### Network Requests

- Open DevTools → Network tab
- Check request/response headers
- Look for 401 errors (token refresh)
- Check 400 errors (validation)

### Redux DevTools

Install Redux DevTools browser extension for time-travel debugging

---

## 📦 Dependencies

### Core

- `react` - UI library
- `react-dom` - DOM rendering
- `react-router-dom` - Routing
- `@reduxjs/toolkit` - State management
- `react-redux` - React bindings

### HTTP

- `axios` - HTTP client

### UI

- `tailwindcss` - Styling
- `lucide-react` - Icons
- `framer-motion` - Animations

### Dev

- `vite` - Build tool
- `eslint` - Linting

---

## 🐛 Troubleshooting

### API Not Responding

1. Check if backend is running (`docker-compose ps`)
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS in gateway
4. Check browser console for errors

### Authentication Not Working

1. Clear localStorage: `localStorage.clear()`
2. Refresh page and try again
3. Check token in browser DevTools
4. Verify API response format

### Form Not Submitting

1. Check validation errors in console
2. Verify all required fields are filled
3. Check Redux state in DevTools
4. Look for API error responses

### Styling Issues

1. Clear browser cache (Ctrl+Shift+Del)
2. Rebuild Tailwind: `npm run build`
3. Check class names match CSS
4. Use browser DevTools to inspect

---

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Redux Toolkit Docs](https://redux-toolkit.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Axios Documentation](https://axios-http.com)
- [React Router v6 Guide](https://reactrouter.com)

---

## 🤝 Code Standards

### File Naming

- Components: `PascalCase.jsx`
- Utils/Hooks: `camelCase.js`
- CSS: `kebab-case.css`

### Component Structure

```jsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import './MyComponent.css';

const MyComponent = () => {
  const dispatch = useDispatch();
  const state = useSelector(s => s.slice);

  useEffect(() => {
    // Effects here
  }, []);

  return (
    // JSX here
  );
};

export default MyComponent;
```

### Redux Action Names

- Thunks: `auth/login`, `application/createDraft`
- Reducers: `logout`, `updateFormField`

---

## 📋 Checklist for New Features

- [ ] Create component/page file
- [ ] Add Redux actions if needed
- [ ] Add Redux reducers if needed
- [ ] Add route in App.jsx
- [ ] Add API service if needed
- [ ] Add navigation link
- [ ] Test locally
- [ ] Check responsiveness
- [ ] Test error scenarios

---

**Happy coding! 🚀**
