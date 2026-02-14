import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import supplierService from "@features/suppliers/services/supplierService";
import produkSupplierService from "@features/suppliers/services/produkSupplierService";
import transaksiService from "@features/transactions/services/transaksiService";
import { useCabang } from "@features/cabang/hooks/useCabang";

/**
 * Custom hook for managing supplier purchases with multi-branch support
 */
export const useSupplierPurchase = (supplierId, initialBranchId = null) => {
  const queryClient = useQueryClient();
  const { selectedCabang } = useCabang();
  const [selectedBranchId, setSelectedBranchId] = useState(
    initialBranchId || selectedCabang?.id
  );
  
  // Pagination state
  const [purchasePage, setPurchasePage] = useState(1);
  const [priceHistoryPage, setPriceHistoryPage] = useState(1);
  const purchaseLimit = 10;
  const priceHistoryLimit = 10;

  // Update selected branch when prop changes
  useEffect(() => {
    if (initialBranchId) {
      setSelectedBranchId(initialBranchId);
    }
  }, [initialBranchId]);

  // Get available branches for this supplier
  const {
    data: branchesData,
    isLoading: isLoadingBranches,
    error: branchesError,
  } = useQuery({
    queryKey: ["supplier-branches", supplierId],
    queryFn: () => supplierService.getSupplierBranches(supplierId),
    enabled: !!supplierId,
  });

    // Get supplier details
    const {
      data: supplierData,
      isLoading: isLoadingSupplier,
      error: supplierError,
    } = useQuery({
      queryKey: ["supplier", supplierId],
      queryFn: () => supplierService.getSupplierDetail(supplierId),
      enabled: !!supplierId,
    });
  
    // Get supplier's products - now with branch filtering
    const {
      data: productsData,
      isLoading: isLoadingProducts,
      error: productsError,
      refetch: refetchProducts,
    } = useQuery({
      queryKey: ["supplier-products", supplierId, selectedBranchId],
      queryFn: () =>
        supplierService.getSupplierProducts(supplierId, {
          cabangId: selectedBranchId,
        }),
      enabled: !!supplierId && !!selectedBranchId,
    });
  
    // Get purchase history
    const {
      data: purchaseHistoryData,
      isLoading: isLoadingHistory,
      error: historyError,
    } = useQuery({
      queryKey: ["supplier-purchases", supplierId, selectedBranchId, purchasePage],
      queryFn: () =>
        supplierService.getSupplierPurchaseHistory(supplierId, {
          cabang_id: selectedBranchId,
          page: purchasePage,
          limit: purchaseLimit,
        }),
      enabled: !!supplierId && !!selectedBranchId,
    });
  
    // Get price history
    const {
      data: priceHistoryData,
      isLoading: isLoadingPriceHistory,
      error: priceHistoryError,
    } = useQuery({
      queryKey: ["supplier-price-history", supplierId, selectedBranchId, priceHistoryPage],
      queryFn: () =>
        supplierService.getSupplierPriceHistory(supplierId, {
          cabangId: selectedBranchId,
          page: priceHistoryPage,
          limit: priceHistoryLimit,
        }),
      enabled: !!supplierId && !!selectedBranchId,
    });

    const createPurchaseMutation = useMutation({
      mutationFn: (data) =>
        transaksiService.createTransaksi({
          ...data,
          jenis_transaksi: "PEMBELIAN",
          supplier_id: supplierId,
          cabang_id: selectedBranchId,
        }),
      onSuccess: () => {
        toast.success("Transaksi pembelian berhasil dibuat");
  
        // Invalidate affected queries
        queryClient.invalidateQueries(["supplier-purchases"]);
        queryClient.invalidateQueries(["transactions"]);
        queryClient.invalidateQueries(["products"]);
      },
      onError: (error) => {
        toast.error(
          `Gagal membuat transaksi: ${error.message || "Terjadi kesalahan"}`
        );
      },
    });
  
    // Create product-supplier relationship mutation
    const createProdukSupplierMutation = useMutation({
      mutationFn: (data) =>
        produkSupplierService.createProdukSupplier({
          ...data,
          supplierId,
          cabangId: data.cabangId || selectedBranchId, // Use branch if provided, otherwise use current selected branch
        }),
      onSuccess: () => {
        toast.success("Produk berhasil ditambahkan ke supplier");
  
        // Invalidate supplier products query
        queryClient.invalidateQueries(["supplier-products"]);
        refetchProducts();
      },
      onError: (error) => {
        toast.error(
          `Gagal menambahkan produk: ${error.message || "Terjadi kesalahan"}`
        );
      },
    });
  
    // Update product-supplier relationship mutation
    const updateProdukSupplierMutation = useMutation({
      mutationFn: ({ id, data }) =>
        produkSupplierService.updateProdukSupplier(id, data),
      onSuccess: () => {
        toast.success("Hubungan produk-supplier berhasil diperbarui");
        queryClient.invalidateQueries(["supplier-products"]);
        refetchProducts();
      },
      onError: (error) => {
        toast.error(
          `Gagal memperbarui hubungan: ${error.message || "Terjadi kesalahan"}`
        );
      },
    });
  
    // Delete product-supplier relationship mutation
    const deleteProdukSupplierMutation = useMutation({
      mutationFn: (id) => produkSupplierService.deleteProdukSupplier(id),
      onSuccess: () => {
        toast.success("Hubungan produk-supplier berhasil dihapus");
        queryClient.invalidateQueries(["supplier-products"]);
        refetchProducts();
      },
      onError: (error) => {
        toast.error(
          `Gagal menghapus hubungan: ${error.message || "Terjadi kesalahan"}`
        );
      },
    });
  
    // Calculate stock for products across branches
    const calculateMultiBranchStock = (produkMasterId) => {
      if (!branchesData || !branchesData.data)
        return { totalStock: 0, branches: [] };
  
      const branchStocks = [];
      let totalStock = 0;
  
      // This would require additional API calls to get stock per branch
      // For now, returning a placeholder implementation
      return { totalStock: 0, branches: [] };
    };
  
    // Pagination handlers
    const goToNextPurchasePage = () => {
      if (purchaseHistoryData?.pagination?.next_page) {
        setPurchasePage((prev) => prev + 1);
      }
    };
  
    const goToPreviousPurchasePage = () => {
      if (purchaseHistoryData?.pagination?.prev_page) {
        setPurchasePage((prev) => Math.max(1, prev - 1));
      }
    };
  
    const goToNextPriceHistoryPage = () => {
      if (priceHistoryData?.pagination?.next_page) {
        setPriceHistoryPage((prev) => prev + 1);
      }
    };
  
    const goToPreviousPriceHistoryPage = () => {
      if (priceHistoryData?.pagination?.prev_page) {
        setPriceHistoryPage((prev) => Math.max(1, prev - 1));
      }
    };
  
    return {
      // Data
      branches: branchesData?.data || [],
      selectedBranchId,
      supplier: supplierData?.data || supplierData,
    products: productsData || [],
    purchaseHistory: purchaseHistoryData?.data || [],
    purchaseHistoryPagination: purchaseHistoryData?.pagination || {},
    priceHistory: priceHistoryData?.data || [],
    priceHistoryPagination: priceHistoryData?.pagination || {},

    // Loading states
    isLoadingBranches,
    isLoadingSupplier,
    isLoadingProducts,
    isLoadingHistory,
    isLoadingPriceHistory,
    isCreatingPurchase: createPurchaseMutation.isPending,
    isCreatingProductRelation: createProdukSupplierMutation.isPending,
    isUpdatingProductRelation: updateProdukSupplierMutation.isPending,
    isDeletingProductRelation: deleteProdukSupplierMutation.isPending,

    // Errors
    branchesError,
    supplierError,
    productsError,
    historyError,
    priceHistoryError,

    // Actions
    setSelectedBranchId,
    createPurchase: createPurchaseMutation.mutate,
    addProductToSupplier: createProdukSupplierMutation.mutate,
    updateProductSupplier: updateProdukSupplierMutation.mutate,
    deleteProductSupplier: deleteProdukSupplierMutation.mutate,
    calculateMultiBranchStock,
    refetchProducts,
    
    // Pagination
    goToNextPurchasePage,
    goToPreviousPurchasePage,
    goToNextPriceHistoryPage,
    goToPreviousPriceHistoryPage,
  };
};
