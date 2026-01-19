import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@shared/api/dashboardApi';
import { useBranch } from '@shared/hooks';

/**
 * Dashboard Query Keys
 */
export const dashboardKeys = {
  all: ['dashboard'],
  dashboard: (cabangId) => [...dashboardKeys.all, 'main', cabangId || 'all'],
  activeShift: (cabangId) => [...dashboardKeys.all, 'activeShift', cabangId],
  transactionDashboard: (cabangId) => [...dashboardKeys.all, 'transaction', cabangId || 'all'],
};

/**
 * Hook untuk mendapatkan data dashboard utama
 * Super admin dengan "Semua Cabang" akan mendapat data agregat
 */
export const useDashboard = (options = {}) => {
  const { activeBranchId, isViewingAllBranches, isSuperAdmin } = useBranch();
  
  // For super admin viewing all, pass null to get aggregated data
  const branchIdToUse = isViewingAllBranches ? null : activeBranchId;
  
  return useQuery({
    queryKey: dashboardKeys.dashboard(branchIdToUse),
    queryFn: () => dashboardApi.getDashboard(branchIdToUse),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    // Enable for super admin viewing all, or when we have a specific branch
    enabled: isSuperAdmin || !!activeBranchId || options.enabled !== false,
    ...options,
  });
};

/**
 * Hook untuk mendapatkan active shift
 * Note: Active shift only makes sense for specific branch
 */
export const useActiveShift = (cabangId, options = {}) => {
  const { activeBranchId, isViewingAllBranches } = useBranch();
  
  // Don't fetch shift when viewing all branches
  const branchId = cabangId || activeBranchId;
  
  return useQuery({
    queryKey: dashboardKeys.activeShift(branchId),
    queryFn: () => dashboardApi.getActiveShift(branchId),
    staleTime: 1 * 60 * 1000, // 1 minute
    // Only enable when we have a specific branch (not "all")
    enabled: !!branchId && !isViewingAllBranches,
    ...options,
  });
};

/**
 * Hook untuk transaction dashboard
 */
export const useTransactionDashboard = (options = {}) => {
  const { activeBranchId, isViewingAllBranches, isSuperAdmin } = useBranch();
  
  const branchIdToUse = isViewingAllBranches ? null : activeBranchId;
  
  return useQuery({
    queryKey: dashboardKeys.transactionDashboard(branchIdToUse),
    queryFn: () => dashboardApi.getTransactionDashboard(branchIdToUse),
    staleTime: 5 * 60 * 1000,
    enabled: isSuperAdmin || !!activeBranchId,
    ...options,
  });
};
