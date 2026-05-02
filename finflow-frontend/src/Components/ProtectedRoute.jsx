import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * PROTECTED ROUTE WRAPPER:
 * This component acts as the application's "Gatekeeper."
 * 1. Authenticated Check: Redirects to /login if the token is missing.
 * 2. Role Authorization: Compares userRole against allowedRoles for a page.
 * 3. Loading State: Handles the "flicker" during initial authentication check.
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    // Normalize role strings (remove ROLE_ prefix) for cross-service consistency
    const normalizedUserRole = userRole?.replace('ROLE_', '');
    const isAllowed = allowedRoles.some(role => role.replace('ROLE_', '') === normalizedUserRole);
    
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
