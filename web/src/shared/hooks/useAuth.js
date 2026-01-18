import { useEffect } from 'react';
import useAuthStore from '@entities/user/model/useAuthStore';
import useBranchStore from '@entities/branch/model/useBranchStore';

/**
 * useAuth Hook
 * Provides convenient access to auth state and actions
 */
export const useAuth = () => {
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

  // Enhanced logout that also clears branch
  const handleLogout = async () => {
    await logout();
    clearBranch();
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
