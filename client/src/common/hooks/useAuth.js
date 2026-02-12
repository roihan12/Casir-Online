import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../app/store/useAuthStore';

/**
 * useAuth Hook
 * Provides convenient access to auth state and actions
 * Now uses Zustand store instead of Context
 */
export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    checkAuth,
    setUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    getUserRole,
    getPrimaryCabang,
    getUserCabang,
    getDefaultRedirect,
  } = useAuthStore();

  // Enhanced login that returns redirect path
  const login = async (username, password) => {
    const result = await storeLogin(username, password);
    if (result.success) {
      // Clear any stale queries
      queryClient.invalidateQueries(['auth']);
    }
    return result;
  };

  // Enhanced logout that also clears React Query cache
  const logout = async () => {
    await storeLogout();
    // Clear all React Query cache including sidebar menu
    queryClient.clear();
  };

  // Check if user has specific role (backward compatibility)
  const hasRole = (role) => {
    return getUserRole() === role;
  };

  return {
    user,
    setUser,
    isAuthenticated,
    isLoading,
    error,
    setError: clearError,
    login,
    logout,
    checkAuth,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
    getUserRole,
    getPrimaryCabang,
    getUserCabang,
    hasRole,
    getDefaultRedirect,
  };
};

export default useAuth;
