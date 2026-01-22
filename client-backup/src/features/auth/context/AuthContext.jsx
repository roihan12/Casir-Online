import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/useAuthStore';

/**
 * AuthProvider - Checks auth status on app load (one-time only)
 * Simplified version using Zustand store
 */
export const AuthProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const isLoading = useAuthStore(state => state.isLoading);

  useEffect(() => {
    // Only check auth once on initial load, not on every render
    // Skip if already checked or if on login page
    if (hasChecked.current || location.pathname === '/login') {
      return;
    }

    hasChecked.current = true;

    // If we have stored auth state, validate with server
    if (isAuthenticated) {
      checkAuth().then((isValid) => {
        if (!isValid && location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      });
    }
  }, []);

  return children;
};

// Also export useAuth hook from here for backward compatibility
export { useAuth } from '../hooks/useAuth';

export default AuthProvider;
