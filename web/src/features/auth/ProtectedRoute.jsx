import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@entities/user/model/useAuthStore';
import useBranchStore from '@entities/branch/model/useBranchStore';

/**
 * ProtectedRoute Component
 * Protects routes requiring authentication and optionally permissions/branch access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} props.permissions - Required permissions (all must match)
 * @param {string[]} props.anyPermissions - Required permissions (any must match)
 * @param {boolean} props.requireBranch - Require active branch selection
 * @param {string} props.redirectTo - Where to redirect if not authorized
 */
const ProtectedRoute = ({
  children,
  permissions = [],
  anyPermissions = [],
  requireBranch = false,
  redirectTo = '/login',
}) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { activeBranch } = useBranchStore();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="glass p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check permissions (all must match)
  if (permissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const isSuperAdmin = user?.roles?.some(r => r.namaRole === 'super_admin');
    
    if (!isSuperAdmin) {
      const hasAllPermissions = permissions.every(p => userPermissions.includes(p));
      if (!hasAllPermissions) {
        return (
          <div className="min-h-screen bg-gradient-main flex items-center justify-center">
            <div className="glass p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
              <p className="text-gray-600 mb-4">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
              <button 
                onClick={() => window.history.back()}
                className="btn-primary px-6 py-2 rounded-lg"
              >
                Kembali
              </button>
            </div>
          </div>
        );
      }
    }
  }

  // Check anyPermissions (any must match)
  if (anyPermissions.length > 0) {
    const userPermissions = user?.permissions || [];
    const isSuperAdmin = user?.roles?.some(r => r.namaRole === 'super_admin');
    
    if (!isSuperAdmin) {
      const hasAnyPermission = anyPermissions.some(p => userPermissions.includes(p));
      if (!hasAnyPermission) {
        return (
          <div className="min-h-screen bg-gradient-main flex items-center justify-center">
            <div className="glass p-8 text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Akses Ditolak</h2>
              <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
            </div>
          </div>
        );
      }
    }
  }

  // Check branch requirement
  if (requireBranch && !activeBranch) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="glass p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Cabang</h2>
          <p className="text-gray-600">Silakan pilih cabang terlebih dahulu untuk melanjutkan.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
