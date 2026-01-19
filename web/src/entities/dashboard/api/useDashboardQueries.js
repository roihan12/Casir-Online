import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@shared/api/dashboardApi';
import { useBranch } from '@shared/hooks';

/**
 * Dashboard Query Keys
 */
export const dashboardKeys = {
  all: ['dashboard'],
  dashboard: (cabangId) => [...dashboardKeys.all, 'main', cabangId],
  activeShift: (cabangId) => [...dashboardKeys.all, 'activeShift', cabangId],
  transactionDashboard: (cabangId) => [...dashboardKeys.all, 'transaction', cabangId],
};

/**
 * Hook untuk mendapatkan data dashboard utama
 */
export const useDashboard = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: dashboardKeys.dashboard(activeBranchId),
    queryFn: () => dashboardApi.getDashboard(activeBranchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    enabled: !!activeBranchId || options.enabled !== false,
    ...options,
  });
};

/**
 * Hook untuk mendapatkan active shift
 */
export const useActiveShift = (cabangId, options = {}) => {
  const { activeBranchId } = useBranch();
  const branchId = cabangId || activeBranchId;
  
  return useQuery({
    queryKey: dashboardKeys.activeShift(branchId),
    queryFn: () => dashboardApi.getActiveShift(branchId),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: !!branchId,
    ...options,
  });
};

/**
 * Hook untuk transaction dashboard
 */
export const useTransactionDashboard = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: dashboardKeys.transactionDashboard(activeBranchId),
    queryFn: () => dashboardApi.getTransactionDashboard(activeBranchId),
    staleTime: 5 * 60 * 1000,
    enabled: !!activeBranchId,
    ...options,
  });
};
