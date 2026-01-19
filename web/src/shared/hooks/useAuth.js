import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@entities/user/model/useAuthStore';
import useBranchStore from '@entities/branch/model/useBranchStore';

/**
 * useAuth Hook
 * Provides convenient access to auth state and actions
 */
export const useAuth = () => {
  const queryClient = useQueryClient();
  
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  } = useAuthStore();

  const { syncWithUser, clearBranch } = useBranchStore();

  // Sync branch data when user changes
  useEffect(() => {
    if (user) {
      syncWithUser(user);
    }
  }, [user, syncWithUser]);

  // Enhanced logout that also clears branch and React Query cache
  const handleLogout = async () => {
    await logout();
    clearBranch();
    // Clear all React Query cache including sidebar menu
    queryClient.clear();
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout: handleLogout,
    checkAuth,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isSuperAdmin,
  };
};

export default useAuth;
