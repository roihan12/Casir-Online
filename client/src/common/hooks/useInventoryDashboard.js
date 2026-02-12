import { useQuery } from "@tanstack/react-query";
import api from "@common/utils/api";
import { toast } from "react-hot-toast";

export const useInventoryDashboard = () => {
  // Get dashboard data
  const useDashboardData = (cabangId = "all", period = 30) => {
    return useQuery({
      queryKey: ["inventoryDashboard", cabangId, period],
      queryFn: async () => {
        const response = await api.get("/inventory-dashboard", {
          params: { cabangId, period },
        });
        return response.data;
      },
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching dashboard data:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch dashboard data"
        );
      },
    });
  };

  // Get low stock products
  const useLowStockProducts = (cabangId = "all") => {
    return useQuery({
      queryKey: ["lowStockProducts", cabangId],
      queryFn: async () => {
        const response = await api.get("/inventory-dashboard/low-stock", {
          params: { cabangId },
        });
        return response.data;
      },
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching low stock products:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch low stock products"
        );
      },
    });
  };

  // Get stock movement data
  const useStockMovementData = (cabangId = "all", period = 30) => {
    return useQuery({
      queryKey: ["stockMovementData", cabangId, period],
      queryFn: async () => {
        const response = await api.get("/inventory-dashboard/stock-movement", {
          params: { cabangId, period },
        });
        return response.data;
      },
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching stock movement data:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch stock movement data"
        );
      },
    });
  };

  // Get stock value
  const useStockValue = (cabangId = "all") => {
    return useQuery({
      queryKey: ["stockValue", cabangId],
      queryFn: async () => {
        const response = await api.get("/inventory-dashboard/stock-value", {
          params: { cabangId },
        });
        return response.data;
      },
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching stock value:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch stock value"
        );
      },
    });
  };

  // Get branch transfer data
  const useBranchTransferData = (cabangId = "all", period = 30) => {
    return useQuery({
      queryKey: ["branchTransferData", cabangId, period],
      queryFn: async () => {
        const response = await api.get("/inventory-dashboard/branch-transfer", {
          params: { cabangId, period },
        });
        return response.data;
      },
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching branch transfer data:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to fetch branch transfer data"
        );
      },
    });
  };

  return {
    useDashboardData,
    useLowStockProducts,
    useStockMovementData,
    useStockValue,
    useBranchTransferData,
  };
};
