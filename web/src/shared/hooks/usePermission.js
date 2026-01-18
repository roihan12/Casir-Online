import useAuthStore from '@entities/user/model/useAuthStore';

/**
 * usePermission Hook
 * Provides permission checking utilities
 */
export const usePermission = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin } = useAuthStore();
  const user = useAuthStore(state => state.user);

  /**
   * Check if user can perform action based on permission
   * @param {string} permission - Permission string like "produk:create"
   * @returns {boolean}
   */
  const can = (permission) => {
    if (isSuperAdmin()) return true;
    return hasPermission(permission);
  };

  /**
   * Check if user has any of the specified permissions
   * @param {string[]} permissions - Array of permission strings
   * @returns {boolean}
   */
  const canAny = (permissions) => {
    if (isSuperAdmin()) return true;
    return hasAnyPermission(permissions);
  };

  /**
   * Check if user has all of the specified permissions
   * @param {string[]} permissions - Array of permission strings
   * @returns {boolean}
   */
  const canAll = (permissions) => {
    if (isSuperAdmin()) return true;
    return hasAllPermissions(permissions);
  };

  /**
   * Get user's role names
   * @returns {string[]}
   */
  const getRoles = () => {
    return user?.roles?.map(r => r.namaRole) || [];
  };

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role name to check
   * @returns {boolean}
   */
  const hasRole = (roleName) => {
    return user?.roles?.some(r => r.namaRole === roleName) || false;
  };

  return {
    can,
    canAny,
    canAll,
    getRoles,
    hasRole,
    isSuperAdmin: isSuperAdmin(),
    permissions: user?.permissions || [],
  };
};

export default usePermission;
