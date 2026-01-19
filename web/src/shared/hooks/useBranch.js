import useBranchStore from '@entities/branch/model/useBranchStore';
import useAuthStore from '@entities/user/model/useAuthStore';

/**
 * useBranch Hook
 * Provides convenient access to branch state and actions
 * Super admin can view all branches data
 */
export const useBranch = () => {
  const {
    activeBranch,
    availableBranches,
    setActiveBranch,
    switchBranch,
    canAccessBranch,
  } = useBranchStore();

  const user = useAuthStore(state => state.user);
  
  // Check if user is super admin
  const isSuperAdmin = user?.roles?.some(r => r.namaRole === 'super_admin') || false;

  // Handle "all" branch selection for super admin
  const handleSwitchBranch = (cabangId) => {
    if (cabangId === 'all') {
      // Set a special "all branches" state
      setActiveBranch({ cabangId: 'all', namaCabang: 'Semua Cabang', isAll: true });
      return true;
    }
    return switchBranch(cabangId);
  };

  // Determine if viewing all branches
  const isViewingAllBranches = activeBranch?.cabangId === 'all' || activeBranch?.isAll;

  return {
    activeBranch,
    availableBranches,
    setActiveBranch,
    switchBranch: handleSwitchBranch,
    canAccessBranch,
    
    // Computed
    isSuperAdmin,
    hasMultipleBranches: availableBranches.length > 1 || isSuperAdmin,
    activeBranchId: isViewingAllBranches ? null : (activeBranch?.cabangId || null),
    activeBranchName: activeBranch?.namaCabang || 'Pilih Cabang',
    isViewingAllBranches,
    
    // Super admin can select "all"
    canViewAllBranches: isSuperAdmin,
  };
};

export default useBranch;
