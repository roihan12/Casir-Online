import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

/**
 * Custom hook for inventory dashboard queries
 */
const useInventoryDashboardQueries = () => {
  const queryClient = useQueryClient();

  /**
   * Get main dashboard data
   */
  const useInventoryDashboard = (cabangId, period = "7days") => {
    return useQuery(
      ["inventoryDashboard", cabangId, period],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;
        if (period) params.period = period;

        const response = await api.get("/inventory-dashboard/new", { params });
        return response.data.data;
      },
      {
        keepPreviousData: true,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  /**
   * Get low stock products
   */
  const useLowStockProducts = (cabangId) => {
    return useQuery(
      ["lowStockProducts", cabangId],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;

        const response = await api.get("/inventory-dashboard/low-stock", { params });
        return response.data.data;
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  /**
   * Get stock movement data
   */
  const useStockMovementData = (cabangId, period = 30) => {
    return useQuery(
      ["stockMovement", cabangId, period],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;
        if (period) params.period = period;

        const response = await api.get("/inventory-dashboard/stock-movement", { params });
        return response.data.data;
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  /**
   * Get stock value
   */
  const useStockValue = (cabangId) => {
    return useQuery(
      ["stockValue", cabangId],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;

        const response = await api.get("/inventory-dashboard/stock-value", { params });
        return response.data.data;
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  /**
   * Get branch transfer data
   */
  const useBranchTransferData = (cabangId, period = 30) => {
    return useQuery(
      ["branchTransfer", cabangId, period],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;
        if (period) params.period = period;

        const response = await api.get("/inventory-dashboard/branch-transfer", { params });
        return response.data.data;
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  /**
   * Get expiring products
   */
  const useExpiringProducts = (cabangId, period = "30days") => {
    return useQuery(
      ["expiringProducts", cabangId, period],
      async () => {
        const params = {};
        if (cabangId) params.cabangId = cabangId;
        if (period) params.period = period;

        const response = await api.get("/inventory-dashboard/expiring-products", { params });
        return response.data.data;
      },
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      }
    );
  };

  return {
    useInventoryDashboard,
    useLowStockProducts,
    useStockMovementData,
    useStockValue,
    useBranchTransferData,
    useExpiringProducts,
  };
};

export default useInventoryDashboardQueries;
