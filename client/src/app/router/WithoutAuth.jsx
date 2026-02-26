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
  const { isAuthenticated, isLoading, getDefaultRedirect } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If logged in, redirect based on permissions to prevent infinite loops
  if (isAuthenticated) {
    const defaultPath = getDefaultRedirect();
    return <Navigate to={defaultPath} replace />;
  }

  // If not logged in, render children (no need to check auth)
  return children;
};

export default WithoutAuth;
