import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";
import { toast } from "react-hot-toast";

/**
 * Hook for managing stock adjustments
 */
export const useInventoryAdjustment = () => {
  const queryClient = useQueryClient();

  // Create stock adjustment mutation
  const createAdjustment = useMutation({
    mutationFn: (adjustmentData) =>
      inventoryService.createStockAdjustment(adjustmentData),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["stockMovement"] });
      queryClient.invalidateQueries({ queryKey: ["stockValue"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });

      toast.success("Penyesuaian stok berhasil disimpan");
    },
    onError: (error) => {
      console.error("Error creating stock adjustment:", error);
      toast.error(
        error.response?.data?.message || "Gagal menyimpan penyesuaian stok"
      );
    },
  });

  // Perform stock opname mutation
  const performStockOpname = useMutation({
    mutationFn: (opnameData) => inventoryService.performStockOpname(opnameData),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
      queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryMovements"] });

      toast.success("Stock opname berhasil dilakukan");
    },
    onError: (error) => {
      console.error("Error performing stock opname:", error);
      toast.error(
        error.response?.data?.message || "Gagal melakukan stock opname"
      );
    },
  });

  return {
    createAdjustment,
    performStockOpname,
  };
};

/**
 * Hook for querying inventory movements
 */
export const useInventoryMovements = (params) => {
  return useQuery({
    queryKey: ["inventoryMovements", params],
    queryFn: () => inventoryService.getInventoryMovements(params),
    enabled: !!params?.cabangId, // Only run if cabangId is provided
  });
};

/**
 * Hook for getting current stock report
 */
export const useCurrentStockReport = (cabangId) => {
  return useQuery({
    queryKey: ["currentStockReport", cabangId],
    queryFn: () => inventoryService.getCurrentStockReport(cabangId),
    enabled: !!cabangId && cabangId !== "all", // Only run if a specific cabangId is provided
  });
};
