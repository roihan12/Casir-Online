import { useMutation, useQueryClient } from "@tanstack/react-query";
import inventoryService from "../services/inventoryService";
import { toast } from "react-hot-toast";

/**
 * Custom hook for inventory-related mutations
 * @returns {Object} Object containing mutation hooks
 */
const useInventoryMutations = () => {
  const queryClient = useQueryClient();

  /**
   * Hook for adjusting product stock
   * @returns {UseMutationResult} Mutation result
   */
  const useStockAdjustment = () => {
    return useMutation({
      mutationFn: (adjustmentData) =>
        inventoryService.adjustStock(adjustmentData),
      onSuccess: () => {
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["inventoryDashboard"] });
        queryClient.invalidateQueries({ queryKey: ["lowStockProducts"] });
        queryClient.invalidateQueries({ queryKey: ["stockMovement"] });
        queryClient.invalidateQueries({ queryKey: ["stockValue"] });

        toast.success("Stok berhasil disesuaikan");
      },
      onError: (error) => {
        console.error("Error adjusting stock:", error);
        toast.error(error.response?.data?.message || "Gagal menyesuaikan stok");
      },
    });
  };

  return {
    useStockAdjustment,
  };
};

export default useInventoryMutations;
