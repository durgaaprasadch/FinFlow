import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Public Pages
import Landing from '../Pages/Landing';
import Login from '../Pages/Login';
import Signup from '../Pages/Signup';
import ForgotPassword from '../Pages/ForgotPassword';
import ResetPassword from '../Pages/ResetPassword';
import VerifyEmail from '../Pages/VerifyEmail';

// Protected Pages (Applicant)
import Dashboard from '../Pages/Dashboard';
import LoanApplication from '../Pages/LoanApplication';
import MyApplications from '../Pages/MyApplications';
import TimelineHistory from '../Pages/TimelineHistory';
import Notifications from '../Pages/Notifications';
import ProfileSettings from '../Pages/ProfileSettings';
import Documents from '../Pages/Documents';

// Protected Pages (Admin)
import AdminDashboard from '../Pages/AdminDashboard';

// Layouts & Protection
import DashboardLayout from '../Layouts/DashboardLayout';
import ProtectedRoute from '../Components/ProtectedRoute';

/**
 * AppRouter — Central routing for FinFlow.
 * Handles public, applicant-protected, and admin routes.
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES (No Auth Required) ========== */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* 
          ========== APPLICANT PROTECTED ROUTES ========== 
          Requires 'APPLICANT' role. Uses DashboardLayout for consistent sidebar.
      */}
      <Route
        path="/applicant"
        element={
          <ProtectedRoute allowedRoles={['APPLICANT', 'GUEST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="apply" element={<LoanApplication />} />
        <Route path="applications" element={<MyApplications />} />
        <Route path="upload-docs" element={<Documents />} />
        <Route path="history" element={<TimelineHistory />} />
        <Route path="documents" element={<Documents />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 
          ========== ADMIN PROTECTED ROUTES ========== 
          Requires 'ADMIN' role. Restricted to internal management.
      */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="applications" element={<AdminDashboard />} />
        <Route path="users" element={<AdminDashboard />} />
        <Route path="fraud-detection" element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminDashboard />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* ========== FALLBACK ROUTE ========== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
