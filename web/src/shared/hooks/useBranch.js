import useBranchStore from '@entities/branch/model/useBranchStore';

/**
 * useBranch Hook
 * Provides convenient access to branch state and actions
 */
export const useBranch = () => {
  const {
    activeBranch,
    availableBranches,
    setActiveBranch,
    switchBranch,
    canAccessBranch,
  } = useBranchStore();

  return {
    activeBranch,
    availableBranches,
    setActiveBranch,
    switchBranch,
    canAccessBranch,
    
    // Computed
    hasMultipleBranches: availableBranches.length > 1,
    activeBranchId: activeBranch?.cabangId || null,
    activeBranchName: activeBranch?.namaCabang || 'Pilih Cabang',
  };
};

export default useBranch;
