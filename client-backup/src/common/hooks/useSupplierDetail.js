import { useQuery } from "@tanstack/react-query";
import supplierService from "../services/supplierService";

/**
 * Hook to fetch detailed supplier information
 * @param {string} supplierId - The supplier ID
 * @returns {Object} - Query result with supplier detail data
 */
export const useSupplierDetail = (supplierId) => {
  return useQuery({
    queryKey: ["supplierDetail", supplierId],
    queryFn: () => supplierService.getSupplierDetail(supplierId),
    enabled: !!supplierId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
