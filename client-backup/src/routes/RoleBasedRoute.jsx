import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import ProtectedRoute from './ProtectedRoute';

/**
 * RoleBasedRoute component
 * A flexible route component that handles role-based access control
 * @param {Object} props - Component props
 * @param {Object} props.roleConfig - Configuration for role-based routing
 * @param {React.Component} props.fallbackComponent - Component to render if no matching role is found
 * @param {string} props.fallbackPath - Path to redirect to if no matching role is found and no fallbackComponent is provided
 * @param {boolean} props.strict - If true, only allow access to roles in roleConfig
 * @returns {JSX.Element} React component
 */
const RoleBasedRoute = ({ 
  roleConfig, 
  fallbackComponent: FallbackComponent,
  fallbackPath = '/dashboard',
  strict = false
}) => {
  const { getUserRole } = useAuth();
  const userRole = getUserRole();

  // Get the component and allowed roles for the user role
  const routeData = roleConfig[userRole];
  
  // If no matching role is found
  if (!routeData) {
    // If strict mode is enabled or no fallback component is provided, redirect to fallback path
    if (strict || !FallbackComponent) {
      return <Navigate to={fallbackPath} replace />;
    }
    
    // Otherwise, render the fallback component
    return <FallbackComponent />;
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

export default RoleBasedRoute;