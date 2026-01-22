import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

/**
 * ProtectedRoute Component
 * Protects routes requiring authentication and optionally permissions/branch access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.allowedRoles - Allowed roles (legacy support)
 * @param {string} props.requiredPermission - Single permission required
 * @param {string[]} props.permissions - All permissions required (all must match)
 * @param {string[]} props.anyPermissions - Required permissions (any must match)
 * @param {boolean} props.requireBranch - Require active branch selection
 * @param {string} props.redirectPath - Where to redirect if not authorized
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredPermission = null,
  permissions = [],
  anyPermissions = [],
  requireBranch = false,
  redirectPath = '/no-access',
}) => {
  const location = useLocation();
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    checkAuth,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    isSuperAdmin,
  } = useAuthStore();

  // Check auth on mount if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [isAuthenticated, isLoading, checkAuth]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/80">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super admin bypass all checks
  if (isSuperAdmin()) {
    if (children) {
      return typeof children === 'function' ? children(user) : children;
    }
    return <Outlet />;
  }

  // Check allowed roles (legacy support)
  if (allowedRoles.length > 0) {
    const userRole = getUserRole();
    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
            <p className="text-white/60 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      );
    }
  }

  // Check single required permission
  if (requiredPermission) {
    const reqPermissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasAccess = Array.isArray(requiredPermission) 
      ? hasAnyPermission(reqPermissions) 
      : hasPermission(requiredPermission);

    if (!hasAccess) {
      return <Navigate to={redirectPath} replace />;
    }
  }

  // Check permissions (all must match)
  if (permissions.length > 0) {
    if (!hasAllPermissions(permissions)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
            <p className="text-white/60 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      );
    }
  }

  // Check anyPermissions (any must match)
  if (anyPermissions.length > 0) {
    if (!hasAnyPermission(anyPermissions)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md border border-white/20">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
            <p className="text-white/60">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      );
    }
  }

  // TODO: Add branch requirement check if needed
  // if (requireBranch && !activeBranch) { ... }

  // Render children or outlet
  if (children) {
    return typeof children === 'function' ? children(user) : children;
  }

  return <Outlet />;
};

export default ProtectedRoute;
