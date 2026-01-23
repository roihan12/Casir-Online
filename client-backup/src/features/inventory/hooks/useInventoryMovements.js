import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";
import { toast } from "react-hot-toast";

/**
 * Custom hook for inventory movements-related queries using TanStack Query
 * @param {Object} params - Query parameters for filtering movements
 * @returns {Object} Query result with data, loading, error states and refetch function
 */
export const useInventoryMovements = (params) => {
  return useQuery({
    queryKey: ["inventoryMovements", params],
    queryFn: () => inventoryService.getInventoryMovements(params),
    enabled: !!params?.cabangId, // Only run if cabangId is provided
  });
};

/**
 * Custom hook for recording a new inventory movement
 * @returns {Object} Mutation object for recording movements
 */
export const useRecordMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movementData) => inventoryService.recordMovement(movementData),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["stockValue"] });

      toast.success("Pergerakan stok berhasil dicatat");
    },
    onError: (error) => {
      console.error("Error recording stock movement:", error);
      toast.error(
        error.response?.data?.message || "Gagal mencatat pergerakan stok"
      );
    },
  });
};

/**
 * Custom hook for deleting an inventory movement (for admin use)
 * @returns {Object} Mutation object for deleting movements
 */
export const useDeleteMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (movementId) => inventoryService.deleteMovement(movementId),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });

      toast.success("Pergerakan stok berhasil dihapus");
    },
    onError: (error) => {
      console.error("Error deleting stock movement:", error);
      toast.error(
        error.response?.data?.message || "Gagal menghapus pergerakan stok"
      );
    },
  });
};

/**
 * Custom hook for exporting movement data to CSV
 * @returns {Object} Mutation object for exporting data
 */
export const useExportMovements = () => {
  return useMutation({
    mutationFn: (params) => inventoryService.exportMovements(params),
    onSuccess: (data) => {
      // Handle the blob data from the service
      const url = window.URL.createObjectURL(
        new Blob([data], { type: "text/csv" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inventory-movements-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Data pergerakan stok berhasil diexport");
    },
    onError: (error) => {
      console.error("Error exporting movements:", error);
      toast.error("Gagal mengexport data pergerakan stok");
    },
  });
};

export default {
  useInventoryMovements,
  useRecordMovement,
  useDeleteMovement,
  useExportMovements,
};
