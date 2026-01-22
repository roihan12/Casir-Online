import useAuthStore from '../../store/useAuthStore';

/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show if authorized
 * @param {string} props.permission - Single permission required
 * @param {string[]} props.permissions - All permissions required
 * @param {string[]} props.anyPermissions - Any of these permissions
 * @param {React.ReactNode} props.fallback - Content to show if not authorized
 */
const PermissionGate = ({
  children,
  permission,
  permissions = [],
  anyPermissions = [],
  fallback = null,
}) => {
  const user = useAuthStore(state => state.user);
  const userPermissions = user?.permissions || [];
  const isSuperAdmin = user?.roles?.some(r => r.namaRole === 'super_admin');

  // Super admin can see everything
  if (isSuperAdmin) {
    return children;
  }

  // Check single permission
  if (permission) {
    if (!userPermissions.includes(permission)) {
      return fallback;
    }
  }

  // Check all permissions
  if (permissions.length > 0) {
    const hasAll = permissions.every(p => userPermissions.includes(p));
    if (!hasAll) {
      return fallback;
    }
  }

  // Check any permissions
  if (anyPermissions.length > 0) {
    const hasAny = anyPermissions.some(p => userPermissions.includes(p));
    if (!hasAny) {
      return fallback;
    }
  }

  return children;
};

/**
 * Can Component - Alias for PermissionGate with single permission
 * Usage: <Can permission="produk:create">...</Can>
 */
export const Can = ({ permission, any = true, children, fallback = null }) => {
  // Handle array of permissions
  if (Array.isArray(permission)) {
    if (any) {
      return (
        <PermissionGate anyPermissions={permission} fallback={fallback}>
          {children}
        </PermissionGate>
      );
    } else {
      return (
        <PermissionGate permissions={permission} fallback={fallback}>
          {children}
        </PermissionGate>
      );
    }
  }

  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  );
};

/**
 * CanAny Component - Show if user has any of the permissions
 * Usage: <CanAny permissions={['produk:create', 'produk:update']}>...</CanAny>
 */
export const CanAny = ({ permissions, children, fallback = null }) => (
  <PermissionGate anyPermissions={permissions} fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * CanAll Component - Show if user has all permissions
 * Usage: <CanAll permissions={['produk:create', 'produk:update']}>...</CanAll>
 */
export const CanAll = ({ permissions, children, fallback = null }) => (
  <PermissionGate permissions={permissions} fallback={fallback}>
    {children}
  </PermissionGate>
);

export default PermissionGate;
