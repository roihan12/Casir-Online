import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import posService, { searchHistoryService } from "@services/posService";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

// Hook untuk produk berdasarkan cabang
export const useProductsByBranch = (branchId, options = {}) => {
  return useQuery({
    queryKey: ["products", "branch", branchId],
    queryFn: () => posService.getProductsByBranch(branchId),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 menit
    ...options,
  });
};

// Hook untuk kategori produk
export const useCategories = (options = {}) => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => posService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 menit (kategori jarang berubah)
    ...options,
  });
};

// Hook untuk produk berdasarkan kategori
export const useProductsByCategory = (branchId, categoryId, options = {}) => {
  return useQuery({
    queryKey: ["products", "branch", branchId, "category", categoryId],
    queryFn: () => posService.getProductsByCategory(branchId, categoryId),
    enabled: !!branchId && !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 menit
    ...options,
  });
};

// Hook untuk produk populer
export const usePopularProducts = (branchId, limit = 10, options = {}) => {
  return useQuery({
    queryKey: ["products", "popular", branchId, limit],
    queryFn: () => posService.getPopularProducts(branchId, limit),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 menit
    ...options,
  });
};

// Hook untuk pencarian pelanggan
export const useCustomerSearch = (query, cabang_id = null, options = {}) => {
  return useQuery({
    queryKey: ["customers", "search", query, cabang_id],
    queryFn: () => posService.getCustomers(query, cabang_id),
    enabled: query.length > 2, // Hanya jalankan jika query lebih dari 2 karakter
    staleTime: 30 * 1000, // 30 detik
    ...options,
  });
};

// Hook untuk pencarian produk dengan autocomplete
export const useProductSearch = (branchId, query, options = {}) => {
  return useQuery({
    queryKey: ["products", "search", branchId, query],
    queryFn: () => posService.searchProducts(branchId, query),
    enabled: !!branchId && query.length > 1, // Hanya jalankan jika query lebih dari 1 karakter
    staleTime: 60 * 1000, // 1 menit
    ...options,
  });
};

// Hook untuk mengelola riwayat pencarian
export const useSearchHistory = (branchId) => {
  const [searchHistory, setSearchHistory] = useState([]);

  // Load search history on component mount
  useEffect(() => {
    if (branchId) {
      const history = searchHistoryService.getSearchHistory(branchId);
      setSearchHistory(history);
    }
  }, [branchId]);

  // Add search term to history
  const addToHistory = (searchTerm) => {
    if (!branchId || !searchTerm.trim()) return;

    const newHistory = searchHistoryService.addToSearchHistory(
      branchId,
      searchTerm
    );
    setSearchHistory(newHistory);
  };

  // Clear search history
  const clearHistory = () => {
    if (!branchId) return;

    searchHistoryService.clearSearchHistory(branchId);
    setSearchHistory([]);
  };

  return { searchHistory, addToHistory, clearHistory };
};

// Hook untuk membuat transaksi
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionData) =>
      posService.createTransaction(transactionData),
    onSuccess: () => {
      toast.success("Transaksi berhasil dibuat");
      // Invalidasi query berkaitan dengan transaksi jika perlu
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Invalidasi popular products karena mungkin berubah
      queryClient.invalidateQueries({ queryKey: ["products", "popular"] });
    },
    onError: (error) => {
      console.log(error);
      const message =
        error.response?.data?.errors || "Gagal membuat transaksi";
      toast.error(message);
    },
  });
};

// Hook untuk menambahkan pembayaran
export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentData) => posService.addPayment(paymentData),
    onSuccess: () => {
      toast.success("Pembayaran berhasil ditambahkan");
      // Invalidasi query berkaitan dengan pembayaran jika perlu
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Gagal menambahkan pembayaran";
      toast.error(message);
    },
  });
};

// Hook untuk membuat QRIS
export const useGenerateQris = () => {
  return useMutation({
    mutationFn: (qrisData) => posService.generateQrisPayment(qrisData),
    onSuccess: () => {
      toast.success("QRIS berhasil dibuat");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal membuat QRIS";
      toast.error(message);
    },
  });
};

// Hook untuk proses POS lengkap (transaksi + pembayaran)
export const useCompleteTransaction = () => {
  const createTransactionMutation = useCreateTransaction();
  const addPaymentMutation = useAddPayment();

  const completeTransaction = async (transactionData, paymentData) => {
    try {
      // Step 1: Create transaction
      const transaction = await createTransactionMutation.mutateAsync(
        transactionData
      );

      // Step 2: Add payment using transaction ID
      // Skip payment if method is TEMPO/KREDIT_PELANGGAN and no paymentData (no DP)
      const isTempoMethod = transactionData?.metode_pembayaran === 'TEMPO' ||
                           transactionData?.metode_pembayaran === 'KREDIT_PELANGGAN';

      if (isTempoMethod && !paymentData) {
        return {
          transaction,
          payment: {
            status_pembayaran: 'BELUM_LUNAS',
            metode_pembayaran: transactionData?.metode_pembayaran,
            skipped: true
          },
          transactionData: null
        };
      }

      const updatedPaymentData = {
        ...paymentData,
        transaksi_id: transaction.transaksi_id,
      };

      const paymentResponse = await addPaymentMutation.mutateAsync(updatedPaymentData);

      // Return full response including transactionData with hutang info
      return {
        transaction,
        payment: paymentResponse,
        transactionData: paymentResponse?.transactionData || null
      };
    } catch (error) {
      throw error;
    }
  };

  return {
    completeTransaction,
    isLoading:
      createTransactionMutation.isPending || addPaymentMutation.isPending,
    isError: createTransactionMutation.isError || addPaymentMutation.isError,
    error: createTransactionMutation.error || addPaymentMutation.error,
  };
};

// Hook untuk proses pembayaran QRIS
export const useQrisTransaction = () => {
  const createTransactionMutation = useCreateTransaction();
  const generateQrisMutation = useGenerateQris();

  const createQrisTransaction = async (transactionData, qrisData) => {
    try {
      // Step 1: Create transaction
      const transaction = await createTransactionMutation.mutateAsync(
        transactionData
      );

      // Step 2: Generate QRIS using transaction ID
      const updatedQrisData = {
        ...qrisData,
        transaksi_id: transaction.transaksi_id,
      };

      const qrisResponse = await generateQrisMutation.mutateAsync(
        updatedQrisData
      );

      return { transaction, qrisResponse };
    } catch (error) {
      throw error;
    }
  };

  return {
    createQrisTransaction,
    isLoading:
      createTransactionMutation.isPending || generateQrisMutation.isPending,
    isError: createTransactionMutation.isError || generateQrisMutation.isError,
    error: createTransactionMutation.error || generateQrisMutation.error,
  };
};
