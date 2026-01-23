import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@common/utils/api";
import { toast } from "react-hot-toast";

export const usePriceManagement = () => {
  const queryClient = useQueryClient();

  // Update product price
  const useUpdateProductPrice = () => {
    return useMutation({
      mutationFn: async (priceData) => {
        const response = await api.put("/inventory/price", priceData);
        return response.data;
      },
      onSuccess: () => {
        toast.success("Harga produk berhasil diperbarui");
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
      },
      onError: (error) => {
        console.error("Error updating product price:", error);
        toast.error(
          error.response?.data?.message || "Failed to update product price"
        );
      },
    });
  };

  // Get price history
  const usePriceHistory = (productId, options = {}) => {
    return useQuery({
      queryKey: ["priceHistory", productId],
      queryFn: async () => {
        const response = await api.get(`/inventory/price-history`, {
          params: { produkId: productId },
        });
        return response.data;
      },
      enabled: !!productId && options.enabled !== false,
      staleTime: 300000, // 5 minutes
      onError: (error) => {
        console.error("Error fetching price history:", error);
        toast.error(
          error.response?.data?.message || "Failed to fetch price history"
        );
      },
    });
  };

  return {
    useUpdateProductPrice,
    usePriceHistory,
  };
};
