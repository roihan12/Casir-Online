import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

/**
 * DynamicRoute component
 * Renders the appropriate component based on user role and route configuration
 * @param {Object} props - Component props
 * @param {Object} props.routeConfig - Configuration for role-based routing
 * @param {string} props.fallbackPath - Fallback path if no matching route is found
 * @returns {JSX.Element} React component
 */
const DynamicRoute = ({ routeConfig, fallbackPath = '/dashboard' }) => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  // Get the component for the user role or use fallback
  const routeData = routeConfig[userRole];
  
  if (!routeData) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  const { component: Component, allowedRoles = [] } = routeData;
  
  // If allowedRoles is empty or includes the user's role, render the component
  // Otherwise, redirect to fallback path
  return (
    <ProtectedRoute allowedRoles={allowedRoles.length > 0 ? allowedRoles : [userRole]}>
      <Component />
    </ProtectedRoute>
  );
};

export default DynamicRoute;