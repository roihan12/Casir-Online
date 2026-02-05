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

export default {
  useSalesReport,
  useSalesSummary,
  useTopProducts,
  useSalesByCategory,
  useFinancialReport,
  useFinancialSummary,
  useFinancialTransactions,
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
