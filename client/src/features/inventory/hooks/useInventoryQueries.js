import { useQuery } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";

/**
 * Custom hook for inventory-related queries using TanStack Query
 * @returns {Object} Object containing query hooks
 */
const useInventoryQueries = () => {
  /**
   * Get inventory dashboard data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {UseQueryResult} Query result
   */
  const useDashboardData = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["inventoryDashboard", cabangId, period],
      queryFn: () => inventoryService.getDashboardData(cabangId, period),
    });
  };

  /**
   * Get low stock products
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @returns {UseQueryResult} Query result
   */
  const useLowStockProducts = (cabangId, page = 1, limit = 10) => {
    return useQuery({
      queryKey: ["lowStockProducts", cabangId, page, limit],
      queryFn: () => inventoryService.getLowStockProducts(cabangId, page, limit),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get stock movement data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number|string} period - Time period in days or format like '30days'
   * @param {string} interval - Interval for grouping data ('day', 'week', 'month')
   * @returns {UseQueryResult} Query result
   */
  const useStockMovementData = (cabangId, period = 30, interval = 'day') => {
    return useQuery({
      queryKey: ["stockMovement", cabangId, period, interval],
      queryFn: () => inventoryService.getStockMovementData(cabangId, period, interval),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get inventory health score
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {UseQueryResult} Query result
   */
  const useInventoryHealthScore = (cabangId) => {
    return useQuery({
      queryKey: ["inventoryHealthScore", cabangId],
      queryFn: () => inventoryService.getInventoryHealthScore(cabangId),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get branch transfer data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {UseQueryResult} Query result
   */
  const useBranchTransferData = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["branchTransfer", cabangId, period],
      queryFn: () => inventoryService.getBranchTransferData(cabangId, period),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get stock value data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {UseQueryResult} Query result
   */
  const useStockValue = (cabangId) => {
    return useQuery({
      queryKey: ["stockValue", cabangId],
      queryFn: () => inventoryService.getStockValue(cabangId),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get comprehensive inventory dashboard data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {UseQueryResult} Query result with comprehensive dashboard data
   */
  const useComprehensiveDashboardData = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["comprehensiveInventoryDashboard", cabangId, period],
      queryFn: () => inventoryService.getComprehensiveDashboardData(cabangId, period),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get inventory activities data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} limit - Maximum number of activities to return
   * @returns {UseQueryResult} Query result
   */
  const useInventoryActivities = (cabangId, limit = 50) => {
    return useQuery({
      queryKey: ["inventoryActivities", cabangId, limit],
      queryFn: () => inventoryService.getInventoryActivities(cabangId, limit),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get inventory value by category
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {UseQueryResult} Query result
   */
  const useInventoryValueByCategory = (cabangId) => {
    return useQuery({
      queryKey: ["inventoryValueByCategory", cabangId],
      queryFn: () => inventoryService.getInventoryValueByCategory(cabangId),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  /**
   * Get expiring products data
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @param {number} period - Time period in days
   * @returns {UseQueryResult} Query result
   */
  const useExpiringProducts = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["expiringProducts", cabangId, period],
      queryFn: () => inventoryService.getStockKadaluwarsa(cabangId, period, 1, 10),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  const useHighStockMovementsTrends = (cabangId, period = 30) => {
    return useQuery({
      queryKey: ["highStockMovementsTrends", cabangId, period],
      queryFn: () => inventoryService.getHighStockMovementsTrends(cabangId, period),
      // Enable the query for any valid cabangId, including 'all'
      enabled: cabangId !== undefined && cabangId !== null,
    });
  };

  return {
    useDashboardData,
    useLowStockProducts,
    useStockMovementData,
    useBranchTransferData,
    useStockValue,
    useComprehensiveDashboardData,
    useInventoryActivities,
    useInventoryValueByCategory,
    useExpiringProducts,
    useInventoryHealthScore,
    useHighStockMovementsTrends,
  };
};

export default useInventoryQueries;
