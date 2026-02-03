import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import returService from "../services/returService";
import toast from "react-hot-toast";

// Query keys
export const returKeys = {
  all: ["retur"],
  lists: () => [...returKeys.all, "list"],
  list: (filters) => [...returKeys.lists(), { ...filters }],
  details: () => [...returKeys.all, "detail"],
  detail: (id) => [...returKeys.details(), id],
  transaksiAsli: (nomor) => [...returKeys.all, "transaksi-asli", nomor],
};

// Get return list with filters and pagination
export const useReturList = (filters = {}) => {
  return useQuery({
    queryKey: returKeys.list(filters),
    queryFn: async () => {
      const response = await returService.getReturList(filters);
      // Map response to expected format
      return {
        transactions: response.data || [],
        meta: {
          total: response.pagination?.totalItems || 0,
          totalPages: response.pagination?.totalPages || 1,
          currentPage: response.pagination?.currentPage || 1,
        },
      };
    },
    placeholderData: (previousData) => previousData,
  });
};

// Get return by ID
export const useReturById = (id) => {
  return useQuery({
    queryKey: returKeys.detail(id),
    queryFn: async () => {
      const response = await returService.getReturById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Search original transaction for return
export const useSearchTransaksiAsli = (nomorTransaksi, jenisTransaksi, enabled = false) => {
  return useQuery({
    queryKey: returKeys.transaksiAsli(nomorTransaksi),
    queryFn: async () => {
      const response = await returService.searchTransaksiAsli(nomorTransaksi, jenisTransaksi);
      return response.data;
    },
    enabled: enabled && !!nomorTransaksi && nomorTransaksi.length > 3,
  });
};

// Create return mutation
export const useCreateRetur = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await returService.createRetur(data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      const typeMessage = variables.jenisRetur === "RETUR_PENJUALAN" 
        ? "retur penjualan" 
        : "retur pembelian";
      toast.success(`${typeMessage} berhasil dibuat`);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: returKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["transaksi"] });
      
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat retur");
      throw error;
    },
  });
};
