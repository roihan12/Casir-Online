import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import stockTransferService from "../services/stockTransferService";
import { toast } from "react-hot-toast";

// Query keys untuk organisasi dan type safety yang lebih baik
export const stockTransferKeys = {
  all: ["stockTransfers"],
  lists: () => [...stockTransferKeys.all, "list"],
  list: (filters) => [...stockTransferKeys.lists(), { ...filters }],
  stats: () => [...stockTransferKeys.all, "stats"],
  pending: () => [...stockTransferKeys.all, "pending"],
  detail: (id) => [...stockTransferKeys.all, "detail", id],
};

export const useStockTransferQueries = () => {
  const queryClient = useQueryClient();

  // Mendapatkan semua transfer dengan filter
  const useTransfers = (filters, page = 1, limit = 10) => {
    return useQuery({
      queryKey: stockTransferKeys.list({ ...filters, page, limit }),
      queryFn: () =>
        stockTransferService.getStockTransfers({
          ...filters,
          page,
          limit,
        }),
      keepPreviousData: true,
      staleTime: 1000 * 60, // 1 menit
      retry: 2,
      onError: (error) => {
        toast.error(`Gagal mengambil data transfer: ${error.message}`);
      },
    });
  };

  // Mendapatkan statistik transfer stok
  const useTransferStats = (cabangId) => {
    return useQuery({
      queryKey: [...stockTransferKeys.stats(), cabangId],
      queryFn: () => stockTransferService.getTransferStats(cabangId),
      staleTime: 1000 * 60 * 5, // 5 menit
      retry: 2,
      onError: (error) => {
        toast.error(`Gagal mengambil statistik: ${error.message}`);
      },
    });
  };

  // Mendapatkan transfer dengan filter (termasuk status)
  const usePendingTransfers = (filters, page = 1, limit = 10) => {
    return useQuery({
      queryKey: [...stockTransferKeys.pending(), { ...filters, page, limit }],
      queryFn: () =>
        stockTransferService.getStockTransfers({
          ...filters,
          page,
          limit,
        }),
      keepPreviousData: true,
      staleTime: 1000 * 30, // 30 detik untuk data yang sering berubah
      retry: 2,
      onError: (error) => {
        toast.error(`Gagal mengambil data transfer: ${error.message}`);
      },
    });
  };

  // Membuat transfer stok
  const useCreateTransfer = () => {
    return useMutation({
      mutationFn: (data) => stockTransferService.createStockTransfer(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
        toast.success("Transfer stok berhasil dibuat");
      },
      onError: (error) => {
        toast.error(`Gagal membuat transfer: ${error.message}`);
      },
    });
  };

  // Menyetujui transfer stok
  const useApproveTransfer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.approveTransfer(id, data),
      onMutate: async ({ id }) => {
        // Membatalkan fetch yang sedang berjalan
        await queryClient.cancelQueries({ queryKey: stockTransferKeys.pending() });

        // Mendapatkan snapshot data saat ini
        const previousTransfers = queryClient.getQueryData(stockTransferKeys.pending());

        // Update optimistic
        queryClient.setQueryData(stockTransferKeys.pending(), (old) => ({
          ...old,
          data: old.data.filter((transfer) => transfer.id !== id),
        }));

        return { previousTransfers };
      },
      onError: (err, variables, context) => {
        queryClient.setQueryData(stockTransferKeys.pending(), context.previousTransfers);
        toast.error(`Gagal menyetujui transfer: ${err.message}`);
      },
      onSuccess: () => {
        toast.success("Transfer berhasil disetujui");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.pending() });
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      },
    });
  };

  // Menolak transfer stok
  const useRejectTransfer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.rejectTransfer(id, data),
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: stockTransferKeys.pending() });
        const previousTransfers = queryClient.getQueryData(stockTransferKeys.pending());

        queryClient.setQueryData(stockTransferKeys.pending(), (old) => ({
          ...old,
          data: old.data.filter((transfer) => transfer.id !== id),
        }));

        return { previousTransfers };
      },
      onError: (err, variables, context) => {
        queryClient.setQueryData(stockTransferKeys.pending(), context.previousTransfers);
        toast.error(`Gagal menolak transfer: ${err.message}`);
      },
      onSuccess: () => {
        toast.success("Transfer berhasil ditolak");
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.pending() });
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
      },
    });
  };

  // Membatalkan transfer stok
  const useCancelTransfer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.cancelTransfer(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
        toast.success("Transfer berhasil dibatalkan");
      },
      onError: (error) => {
        toast.error(`Gagal membatalkan transfer: ${error.message}`);
      },
    });
  };

  // Menerima transfer stok
  const useReceiveTransfer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.receiveTransfer(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
        toast.success("Transfer berhasil diterima");
      },
      onError: (error) => {
        toast.error(`Gagal menerima transfer: ${error.message}`);
      },
    });
  };

  // Mendapatkan produk yang tersedia untuk transfer dari cabang tertentu
  const useProductsForBranch = (cabangId, options = {}) => {
    return useQuery({
      queryKey: [...stockTransferKeys.all, "products", cabangId],
      queryFn: () => stockTransferService.getProductsForBranch(cabangId),
      enabled: !!cabangId,
      staleTime: 1000 * 60 * 5, // 5 menit
      gcTime: 1000 * 60 * 10, // 10 menit
      refetchOnWindowFocus: false,
      ...options,
      onError: (error) => {
        toast.error(`Gagal mengambil data produk: ${error.message}`);
      },
    });
  };

  // Mengajukan transfer untuk persetujuan
  const useSubmitForApproval = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.submitForApproval(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
        toast.success("Transfer stok berhasil diajukan untuk persetujuan");
      },
      onError: (error) => {
        toast.error(`Gagal mengajukan persetujuan: ${error.message}`);
      },
    });
  };

  // Send a transfer
  const useSendTransfer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => stockTransferService.sendStockTransfer(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: stockTransferKeys.lists() });
        toast.success("Transfer stok berhasil dikirim");
      },
      onError: (error) => {
        toast.error(`Gagal mengirim transfer: ${error.message}`);
      },
    });
  };

  return {
    useTransfers,
    useTransferStats,
    usePendingTransfers,
    useProductsForBranch,
    useCreateTransfer,
    useApproveTransfer,
    useRejectTransfer,
    useCancelTransfer,
    useReceiveTransfer,
    useSubmitForApproval,
    useSendTransfer,
    useCancelTransfer,
    useSendTransfer,
    useReceiveTransfer,
  };
};
