import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import taxService from "../services/taxService";

// Query keys
export const taxKeys = {
  all: ["tax"],
  config: (cabangId) => [...taxKeys.all, "config", cabangId],
};

/**
 * Hook to fetch tax configuration
 * @param {string} cabangId - Cabang ID
 */
export const useTaxConfig = (cabangId) => {
  return useQuery({
    queryKey: taxKeys.config(cabangId),
    queryFn: () => taxService.getTaxConfig(cabangId),
    enabled: !!cabangId,
  });
};

/**
 * Hook to update tax configuration
 */
export const useUpdateTaxConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cabangId, data }) =>
      taxService.updateTaxConfig(cabangId, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch tax config
      queryClient.invalidateQueries({
        queryKey: taxKeys.config(variables.cabangId),
      });
    },
  });
};

/**
 * Hook to calculate tax
 */
export const useCalculateTax = () => {
  return useMutation({
    mutationFn: (data) => taxService.calculateTax(data),
  });
};

/**
 * Hook to bulk update tax configuration
 */
export const useUpdateTaxConfigBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => taxService.updateTaxConfigBulk(data),
    onSuccess: () => {
      // Invalidate and refetch all tax configs
      queryClient.invalidateQueries({
        queryKey: taxKeys.all,
      });
    },
  });
};
