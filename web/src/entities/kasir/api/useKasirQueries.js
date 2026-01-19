import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import kasirApi from '@shared/api/kasirApi';
import { useBranch } from '@shared/hooks';

/**
 * Kasir Query Keys
 */
export const kasirKeys = {
  all: ['kasir'],
  activeShift: (cabangId) => [...kasirKeys.all, 'activeShift', cabangId],
  products: (query, cabangId) => [...kasirKeys.all, 'products', query, cabangId],
  productByCode: (code, cabangId) => [...kasirKeys.all, 'productByCode', code, cabangId],
  customers: (query, cabangId) => [...kasirKeys.all, 'customers', query, cabangId],
  recentTransactions: (cabangId) => [...kasirKeys.all, 'recentTransactions', cabangId],
  transaction: (id) => [...kasirKeys.all, 'transaction', id],
  dashboard: (cabangId) => [...kasirKeys.all, 'dashboard', cabangId],
  dailySummary: (cabangId, date) => [...kasirKeys.all, 'dailySummary', cabangId, date],
};

/**
 * Get active shift for current branch
 */
export const useActiveShift = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.activeShift(activeBranchId),
    queryFn: () => kasirApi.getActiveShift(activeBranchId),
    enabled: !!activeBranchId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto refresh every minute
    ...options,
  });
};

/**
 * Open shift mutation
 */
export const useOpenShift = () => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useBranch();
  
  return useMutation({
    mutationFn: (kasAwal) => kasirApi.openShift({ 
      cabangId: activeBranchId, 
      kasAwal 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kasirKeys.activeShift(activeBranchId) });
    },
  });
};

/**
 * Close shift mutation
 */
export const useCloseShift = () => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useBranch();
  
  return useMutation({
    mutationFn: (data) => kasirApi.closeShift({ 
      cabangId: activeBranchId, 
      ...data 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kasirKeys.activeShift(activeBranchId) });
    },
  });
};

/**
 * Search products
 */
export const useSearchProducts = (query, options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.products(query, activeBranchId),
    queryFn: () => kasirApi.searchProducts(query, activeBranchId),
    enabled: !!activeBranchId && !!query && query.length >= 2,
    staleTime: 60 * 1000,
    ...options,
  });
};

/**
 * Get popular/frequently used products for initial display (when no search query)
 */
export const usePopularProducts = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: [...kasirKeys.all, 'popularProducts', activeBranchId],
    queryFn: () => kasirApi.getPopularProducts(activeBranchId),
    enabled: !!activeBranchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Get product by barcode
 */
export const useProductByCode = (code, options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.productByCode(code, activeBranchId),
    queryFn: () => kasirApi.getProductByCode(code, activeBranchId),
    enabled: !!activeBranchId && !!code,
    staleTime: 60 * 1000,
    retry: false,
    ...options,
  });
};

/**
 * Search customers
 */
export const useSearchCustomers = (query, options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.customers(query, activeBranchId),
    queryFn: () => kasirApi.searchCustomers(query, activeBranchId),
    enabled: !!activeBranchId && !!query && query.length >= 2,
    staleTime: 60 * 1000,
    ...options,
  });
};

/**
 * Create transaction mutation
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { activeBranchId } = useBranch();
  
  return useMutation({
    mutationFn: (transactionData) => kasirApi.createTransaction({
      cabang_id: activeBranchId,
      ...transactionData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kasirKeys.recentTransactions(activeBranchId) });
      queryClient.invalidateQueries({ queryKey: kasirKeys.dashboard(activeBranchId) });
    },
  });
};

/**
 * Get recent transactions
 */
export const useRecentTransactions = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.recentTransactions(activeBranchId),
    queryFn: () => kasirApi.getRecentTransactions({ cabangId: activeBranchId }),
    enabled: !!activeBranchId,
    staleTime: 30 * 1000,
    ...options,
  });
};

/**
 * Get kasir dashboard
 */
export const useKasirDashboard = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: kasirKeys.dashboard(activeBranchId),
    queryFn: () => kasirApi.getDashboard(activeBranchId),
    enabled: !!activeBranchId,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Print receipt mutation
 */
export const usePrintReceipt = () => {
  return useMutation({
    mutationFn: (transactionId) => kasirApi.printReceipt(transactionId),
  });
};
