import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import transaksiService from "../services/transaksiService";
import toast from "react-hot-toast";

// Query keys
export const transaksiKeys = {
  all: ["transaksi"],
  lists: () => [...transaksiKeys.all, "list"],
  list: (filters) => [...transaksiKeys.lists(), { ...filters }],
  details: () => [...transaksiKeys.all, "detail"],
  detail: (id) => [...transaksiKeys.details(), id],
  supplier: (supplierId) => [...transaksiKeys.all, "supplier", supplierId],
};

// Get transaction list with filters and pagination
export const useTransaksiList = (filters = {}) => {
  return useQuery({
    queryKey: transaksiKeys.list(filters),
    queryFn: async () => {
      const response = await transaksiService.getTransaksiList(filters);
      return response.data;
    },
    keepPreviousData: true,
  });
};

// Get transaction by ID
export const useTransaksiById = (id) => {
  return useQuery({
    queryKey: transaksiKeys.detail(id),
    queryFn: async () => {
      const response = await transaksiService.getTransaksiById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Get supplier purchase history
export const useSupplierPurchaseHistory = (supplierId, filters = {}) => {
  return useQuery({
    queryKey: transaksiKeys.supplier(supplierId),
    queryFn: async () => {
      const response = await transaksiService.getSupplierPurchaseHistory(
        supplierId,
        filters
      );
      return response.data;
    },
    enabled: !!supplierId,
  });
};

// Create transaction mutation
export const useCreateTransaksi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await transaksiService.createTransaksi(data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Get transaction type for message
      const transactionType = variables.jenisTransaksi || "transaksi";
      const typeMessage =
        transactionType === "PEMBELIAN"
          ? "pembelian"
          : transactionType === "PENJUALAN"
          ? "penjualan"
          : transactionType === "RETUR_PEMBELIAN"
          ? "retur pembelian"
          : transactionType === "RETUR_PENJUALAN"
          ? "retur penjualan"
          : "transaksi";

      toast.success(`Data ${typeMessage} berhasil dibuat`);

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() });

      // If supplier transaction, invalidate supplier queries
      if (variables.supplierId) {
        queryClient.invalidateQueries({
          queryKey: transaksiKeys.supplier(variables.supplierId),
        });
        queryClient.invalidateQueries({
          queryKey: ["supplier", "detail", variables.supplierId],
        });
      }

      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal membuat transaksi");
      throw error;
    },
  });
};

// Cancel transaction mutation
export const useCancelTransaksi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, alasanBatal }) => {
      const response = await transaksiService.cancelTransaksi(id, alasanBatal);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Transaksi berhasil dibatalkan");
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: transaksiKeys.detail(variables.id),
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal membatalkan transaksi"
      );
    },
  });
};

// Add payment mutation
export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await transaksiService.addPayment(data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Pembayaran berhasil ditambahkan");
      if (variables.transaksiId) {
        queryClient.invalidateQueries({
          queryKey: transaksiKeys.detail(variables.transaksiId),
        });
      }
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal menambahkan pembayaran"
      );
    },
  });
};
