import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, requiredRole = null, redirectTo = '/login' }) => {
  const location = useLocation();
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    const roleRedirects = {
      admin: '/admin/dashboard',
      customer: '/restaurants',
    };
    
    const defaultRedirect = roleRedirects[user?.role] || '/';
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

// Higher-order component for protecting routes
export const withAuth = (Component, requiredRole = null) => {
  return (props) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific role-based protection components
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin" redirectTo="/login">
    {children}
  </ProtectedRoute>
);

export const CustomerRoute = ({ children }) => (
  <ProtectedRoute requiredRole="customer" redirectTo="/login">
    {children}
  </ProtectedRoute>
);

// Component to protect routes that should only be accessed by non-authenticated users
export const GuestRoute = ({ children, redirectTo = '/' }) => {
  const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // If authenticated, redirect based on role
  if (isAuthenticated) {
    const roleRedirects = {
      admin: '/admin/dashboard',
      customer: '/restaurants',
    };
    
    const defaultRedirect = roleRedirects[user?.role] || redirectTo;
    return <Navigate to={defaultRedirect} replace />;
  }

  return children;
};

export default ProtectedRoute;