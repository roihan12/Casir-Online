import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pelangganService from "../services/pelangganService";

// GET hook for single customer
export const useGetCustomer = (id) => {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => pelangganService.getPelangganById(id),
    enabled: !!id, // Only fetch if ID exists
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });
};

// GET hook for customer transactions
export const useGetCustomerTransactions = (id, params = { page: 1, limit: 10 }) => {
  return useQuery({
    queryKey: ["customerTransactions", id, params],
    queryFn: () => pelangganService.getCustomerTransactions(id, params),
    enabled: !!id,
  });
};

// DELETE hook
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => pelangganService.deletePelanggan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
