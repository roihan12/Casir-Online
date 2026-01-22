/**
 * Mock implementation of useInventoryDashboardQueries hook
 * This file provides a mock version of the hook that can be used for testing
 */

import { 
  mockInventoryDashboard, 
  mockLowStockProducts, 
  mockStockMovement, 
  mockStockValue, 
  mockBranchTransfers, 
  mockExpiringProducts 
} from './inventoryDashboardData';

/**
 * Mock implementation of useInventoryDashboardQueries
 * Returns mock data with the same structure as the real hook
 */
const mockInventoryDashboardQueries = () => {
  /**
   * Get main dashboard data
   */
  const useInventoryDashboard = (cabangId, period) => {
    // You could filter the data based on cabangId and period if needed
    return {
      data: mockInventoryDashboard,
      isLoading: false,
      error: null
    };
  };

  /**
   * Get low stock products
   */
  const useLowStockProducts = (cabangId) => {
    return {
      data: mockLowStockProducts,
      isLoading: false,
      error: null
    };
  };

  /**
   * Get stock movement data
   */
  const useStockMovementData = (cabangId, period) => {
    return {
      data: mockStockMovement,
      isLoading: false,
      error: null
    };
  };

  /**
   * Get stock value
   */
  const useStockValue = (cabangId) => {
    return {
      data: mockStockValue,
      isLoading: false,
      error: null
    };
  };

  /**
   * Get branch transfer data
   */
  const useBranchTransferData = (cabangId, period) => {
    return {
      data: mockBranchTransfers,
      isLoading: false,
      error: null
    };
  };

  /**
   * Get expiring products
   */
  const useExpiringProducts = (cabangId, period) => {
    return {
      data: mockExpiringProducts,
      isLoading: false,
      error: null
    };
  };

  return {
    useInventoryDashboard,
    useLowStockProducts,
    useStockMovementData,
    useStockValue,
    useBranchTransferData,
    useExpiringProducts
  };
};

export default mockInventoryDashboardQueries;
