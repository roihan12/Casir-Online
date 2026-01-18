import { useEffect } from 'react';
import { useAuth } from '@shared/hooks';

/**
 * AuthProvider - Checks auth status on app load
 */
const AuthProvider = ({ children }) => {
  const { checkAuth, isAuthenticated } = useAuth();

  useEffect(() => {
    // Check if user is still authenticated on app load
    // This validates the session with the backend
    if (!isAuthenticated) {
      checkAuth();
    }
  }, []);

  return children;
};

export default AuthProvider;
