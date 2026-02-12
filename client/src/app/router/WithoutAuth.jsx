import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth.js";

/**
 * WithoutAuth component - Redirects authenticated users
 * Used for login and other public pages that shouldn't be accessed if already logged in
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} React component
 */
const WithoutAuth = ({ children }) => {
  const { isAuthenticated, isLoading, getUserRole } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If logged in, redirect based on role
  if (isAuthenticated) {
    const userRole = getUserRole();

    if (userRole === "super_admin") {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === "admin_cabang") {
      return <Navigate to="/dashboard" replace />;
    } else if (userRole === "kasir") {
      return <Navigate to="/pos" replace />;
    } else if (userRole === "gudang" || userRole === "manajer") {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  // If not logged in, render children (no need to check auth)
  return children;
};

export default WithoutAuth;
