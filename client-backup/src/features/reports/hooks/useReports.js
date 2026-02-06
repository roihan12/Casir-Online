import { useQuery, useMutation } from "@tanstack/react-query";
import reportService from "../services/reportService";

/**
 * Hook for fetching sales report data
 */
export const useSalesReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["salesReport", params],
    queryFn: () => reportService.getSalesReport(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching sales summary
 */
export const useSalesSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["salesSummary", params],
    queryFn: () => reportService.getSalesSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching top products
 */
export const useTopProducts = (params, options = {}) => {
  return useQuery({
    queryKey: ["topProducts", params],
    queryFn: () => reportService.getTopProducts(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching sales by category
 */
export const useSalesByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["salesByCategory", params],
    queryFn: () => reportService.getSalesByCategory(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching financial dashboard data
 */
export const useFinancialReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["financialDashboard", params],
    queryFn: () => reportService.getFinancialDashboard(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching financial summary
 */
export const useFinancialSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["financialSummary", params],
    queryFn: () => reportService.getFinancialSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching financial transactions
 */
export const useFinancialTransactions = (params, options = {}) => {
  return useQuery({
    queryKey: ["financialTransactions", params],
    queryFn: () => reportService.getFinancialTransactions(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching inventory dashboard data
 */
export const useInventoryDashboard = (params, options = {}) => {
  return useQuery({
    queryKey: ["inventoryDashboard", params],
    queryFn: () => reportService.getInventoryDashboard(params),
    staleTime:5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching inventory report data (alias for inventory dashboard)
 */
export const useInventoryReport = (params, options = {}) => {
  return useInventoryDashboard(params, options);
};

/**
 * Hook for fetching inventory movements
 */
export const useInventoryMovements = (params, options = {}) => {
  return useQuery({
    queryKey: ["inventoryMovements", params],
    queryFn: () => reportService.getInventoryMovements(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

export const useLowStockReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["lowStockReport", params],
    queryFn: () => reportService.getLowStockReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useLowStockByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["lowStockByCategory", params],
    queryFn: () => reportService.getLowStockByCategory(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useExpiringProductsReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["expiringProductsReport", params],
    queryFn: () => reportService.getExpiringProductsReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useExpiringByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["expiringByCategory", params],
    queryFn: () => reportService.getExpiringByCategory(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useStockTransferReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["stockTransferReport", params],
    queryFn: () => reportService.getStockTransferReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useStockTransferByBranch = (params, options = {}) => {
  return useQuery({
    queryKey: ["stockTransferByBranch", params],
    queryFn: () => reportService.getStockTransferByBranch(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useInventoryHealthReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["inventoryHealthReport", params],
    queryFn: () => reportService.getInventoryHealthReport(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useBranchInventoryHealth = (params, options = {}) => {
  return useQuery({
    queryKey: ["branchInventoryHealth", params],
    queryFn: () => reportService.getBranchInventoryHealth(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useHealthScoreDistribution = (params, options = {}) => {
  return useQuery({
    queryKey: ["healthScoreDistribution", params],
    queryFn: () => reportService.getHealthScoreDistribution(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useHealthByDimension = (params, options = {}) => {
  return useQuery({
    queryKey: ["healthByDimension", params],
    queryFn: () => reportService.getHealthByDimension(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useStockMovementTrends = (params, options = {}) => {
  return useQuery({
    queryKey: ["stockMovementTrends", params],
    queryFn: () => reportService.getStockMovementTrends(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useTopMovingProducts = (params, options = {}) => {
  return useQuery({
    queryKey: ["topMovingProducts", params],
    queryFn: () => reportService.getTopMovingProducts(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useStockMovementByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["stockMovementByCategory", params],
    queryFn: () => reportService.getStockMovementByCategory(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useInventoryValueByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["inventoryValueByCategory", params],
    queryFn: () => reportService.getInventoryValueByCategory(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useRecentInventoryActivities = (params, options = {}) => {
  return useQuery({
    queryKey: ["recentInventoryActivities", params],
    queryFn: () => reportService.getRecentInventoryActivities(params),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching branch comparison data
 */
export const useBranchReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["branchReport", params],
    queryFn: () => reportService.getBranchReport(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Mutation hook for exporting reports
 */
export const useExportReport = (options = {}) => {
  return useMutation({
    mutationFn: ({ reportType, format, params }) =>
      reportService.exportReport(reportType, format, params),
    ...options,
  });
};

/**
 * Hook for fetching profit and loss report
 */
export const useProfitLossReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["profitLossReport", params],
    queryFn: () => reportService.getProfitLossReport(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!params.year,
    ...options,
  });
};

/**
 * Hook for fetching profit and loss summary with comparison
 */
export const useProfitLossSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["profitLossSummary", params],
    queryFn: () => reportService.getProfitLossSummary(params),
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

// ==================== SHIFT PERFORMANCE HOOKS ====================

/**
 * Hook for fetching shift summary metrics
 */
export const useShiftSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["shiftSummary", params],
    queryFn: () => reportService.getShiftSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching detailed shift information
 */
export const useShiftDetail = (shiftId, options = {}) => {
  return useQuery({
    queryKey: ["shiftDetail", shiftId],
    queryFn: () => reportService.getShiftDetail(shiftId),
    staleTime: 3 * 60 * 1000,
    enabled: !!shiftId,
    ...options,
  });
};

/**
 * Hook for fetching cash variance report
 */
export const useCashReport = (params, options = {}) => {
  return useQuery({
    queryKey: ["cashReport", params],
    queryFn: () => reportService.getCashReport(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching staff performance comparison
 */
export const useStaffPerformance = (params, options = {}) => {
  return useQuery({
    queryKey: ["staffPerformance", params],
    queryFn: () => reportService.getStaffPerformance(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

// ==================== TRANSACTION DETAIL HOOKS ====================

/**
 * Hook for fetching detailed transaction list
 */
export const useTransactionDetail = (params, options = {}) => {
  return useQuery({
    queryKey: ["transactionDetail", params],
    queryFn: () => reportService.getTransactionDetail(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching transaction summary
 */
export const useTransactionSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["transactionSummary", params],
    queryFn: () => reportService.getTransactionSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching transaction audit trail
 */
export const useAuditTrail = (params, options = {}) => {
  return useQuery({
    queryKey: ["auditTrail", params],
    queryFn: () => reportService.getAuditTrail(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

// ==================== CUSTOMER & LOYALTY HOOKS ====================

/**
 * Hook for fetching customer summary metrics
 */
export const useCustomerSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["customerSummary", params],
    queryFn: () => reportService.getCustomerSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching top customers
 */
export const useTopCustomers = (params, options = {}) => {
  return useQuery({
    queryKey: ["topCustomers", params],
    queryFn: () => reportService.getTopCustomers(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching loyalty metrics
 */
export const useLoyaltyMetrics = (params, options = {}) => {
  return useQuery({
    queryKey: ["loyaltyMetrics", params],
    queryFn: () => reportService.getLoyaltyReport(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching customer acquisition trend
 */
export const useCustomerAcquisition = (params, options = {}) => {
  return useQuery({
    queryKey: ["customerAcquisition", params],
    queryFn: () => reportService.getCustomerAcquisition(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

// ==================== PROMO & DISCOUNT HOOKS ====================

/**
 * Hook for fetching promo summary
 */
export const usePromoSummary = (params, options = {}) => {
  return useQuery({
    queryKey: ["promoSummary", params],
    queryFn: () => reportService.getPromoSummary(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching promo effectiveness
 */
export const usePromoEffectiveness = (promoId, params, options = {}) => {
  return useQuery({
    queryKey: ["promoEffectiveness", promoId, params],
    queryFn: () => reportService.getPromoEffectiveness(promoId, params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(promoId && params.startDate && params.endDate),
    ...options,
  });
};

/**
 * Hook for fetching discount breakdown
 */
export const useDiscountBreakdown = (params, options = {}) => {
  return useQuery({
    queryKey: ["discountBreakdown", params],
    queryFn: () => reportService.getDiscountBreakdown(params),
    staleTime: 5 * 60 * 1000,
    enabled: !!(params.startDate && params.endDate),
    ...options,
  });
};

export default {
  useSalesReport,
  useSalesSummary,
  useTopProducts,
  useSalesByCategory,
  useFinancialReport,
  useFinancialSummary,
  useFinancialTransactions,
  useProfitLossReport,
  useProfitLossSummary,
  useInventoryDashboard,
  useInventoryReport,
  useInventoryMovements,
  useLowStockReport,
  useLowStockByCategory,
  useExpiringProductsReport,
  useExpiringByCategory,
  useStockTransferReport,
  useStockTransferByBranch,
  useInventoryHealthReport,
  useBranchInventoryHealth,
  useHealthScoreDistribution,
  useHealthByDimension,
  useStockMovementTrends,
  useTopMovingProducts,
  useStockMovementByCategory,
  useInventoryValueByCategory,
  useRecentInventoryActivities,
  useBranchReport,
  useExportReport,
};
