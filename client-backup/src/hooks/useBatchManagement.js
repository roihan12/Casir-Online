import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { toast } from "react-hot-toast";

export const useBatchManagement = () => {
  const queryClient = useQueryClient();

  // Get expiring stock
  const useExpiringStock = (cabangId) => {
    return useQuery({
      queryKey: ["expiringStock", cabangId],
      queryFn: async () => {
        const response = await api.get(`/inventory-batch/expiring/${cabangId}`);
        return response.data;
      },
      enabled: !!cabangId && cabangId !== "all",
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching expiring stock:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch expiring stock"
        );
      },
    });
  };

  // Get minimum stock
  const useMinimumStock = (cabangId) => {
    return useQuery({
      queryKey: ["minimumStock", cabangId],
      queryFn: async () => {
        const response = await api.get(`/inventory-batch/minimum/${cabangId}`);
        return response.data;
      },
      enabled: !!cabangId && cabangId !== "all",
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching minimum stock:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch minimum stock"
        );
      },
    });
  };

  // Add product batch
  const useAddProductBatch = () => {
    return useMutation({
      mutationFn: async (batchData) => {
        const response = await api.post("/inventory-batch/batch", batchData);
        return response.data;
      },
      onSuccess: () => {
        toast.success("Batch produk berhasil ditambahkan");
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
      },
      onError: (error) => {
        console.error("Error adding product batch:", error);
        toast.error(
          error.response?.data?.message || "Failed to add product batch"
        );
      },
    });
  };

  // Update stock alert settings
  const useUpdateStockAlertSettings = () => {
    return useMutation({
      mutationFn: async (settingsData) => {
        const response = await api.put("/inventory-batch/alerts", settingsData);
        return response.data;
      },
      onSuccess: () => {
        toast.success("Pengaturan notifikasi stok berhasil diperbarui");
      },
      onError: (error) => {
        console.error("Error updating stock alert settings:", error);
        toast.error(
          error.response?.data?.message ||
            "Failed to update stock alert settings"
        );
      },
    });
  };

  return {
    useExpiringStock,
    useMinimumStock,
    useAddProductBatch,
    useUpdateStockAlertSettings,
  };
};
