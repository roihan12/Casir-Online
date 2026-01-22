import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import produkSupplierService from "../services/produkSupplierService";
import supplierService from "../services/supplierService";
import { useCabang } from "../features/cabang/hooks/useCabang";
import { useEffect } from "react";

/**
 * Custom hook for managing available products for a supplier
 * @param {Object} options - Hook options
 * @param {string} options.supplierId - Supplier ID
 * @param {string} options.cabangId - Branch ID (optional)
 * @param {string} options.search - Search term for filtering products (optional)
 * @returns {Object} Query object with data and loading state
 */
export const useAvailableProductsForSupplier = ({
  supplierId,
  cabangId,
  search = "",
  enabled = true,
}) => {
  // First, get the supplier data to get its cabangId
  const { data: supplierData } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => supplierService.getSupplierById(supplierId),
    enabled: !!supplierId,
  });

  // Get the supplier's cabangId
  const supplierCabangId = supplierData?.data?.cabang_id;

  // Log the incoming cabangId for debugging
  console.log(
    `useAvailableProductsForSupplier - cabangId from params: ${cabangId}`
  );
  console.log(
    `useAvailableProductsForSupplier - cabangId from supplier: ${supplierCabangId}`
  );

  // Determine which cabangId to use - prioritize supplier's cabangId
  const effectiveCabangId = supplierCabangId || cabangId;

  // Don't pass cabangId if it's "global" or invalid
  const params = {
    search,
  };

  // Only add cabangId if it's a valid ID (not "global" or empty)
  if (effectiveCabangId && effectiveCabangId !== "global") {
    params.cabangId = effectiveCabangId;
    console.log(
      `Using cabangId ${effectiveCabangId} for available products query`
    );
  } else {
    console.log("No valid cabangId for available products query");
  }

  return useQuery({
    queryKey: [
      "available-products-for-supplier",
      supplierId,
      effectiveCabangId,
      search,
    ],
    queryFn: () =>
      produkSupplierService.getAvailableProductsForSupplier(supplierId, params),
    enabled: !!supplierId && enabled,
  });
};

/**
 * Custom hook for managing supplier products relationships
 */
export const useSupplierProducts = (options = {}) => {
  const queryClient = useQueryClient();
  const { selectedCabang } = useCabang();
  const {
    supplierId,
    productId,
    branchId = selectedCabang?.id,
    queryParams = {},
  } = options;

  // Get supplier details to get the correct cabangId
  const { data: supplierData, isLoading: isLoadingSupplier } = useQuery({
    queryKey: ["supplier", supplierId],
    queryFn: () => supplierService.getSupplierById(supplierId),
    enabled: !!supplierId,
  });

  // Get the supplier's cabangId
  const supplierCabangId = supplierData?.data?.cabang_id;

  // Log supplier cabangId information
  useEffect(() => {
    if (supplierData?.data) {
      console.log("Supplier data loaded:", supplierData.data);
      console.log("Supplier cabang_id:", supplierCabangId);
      if (!supplierCabangId) {
        console.warn(
          "Supplier does not have a cabang_id - this may cause issues"
        );
      }
    }
  }, [supplierData, supplierCabangId]);

  // Get products by supplier
  const {
    data: supplierProductsData,
    isLoading: isLoadingSupplierProducts,
    error: supplierProductsError,
    refetch: refetchSupplierProducts,
  } = useQuery({
    queryKey: [
      "supplier-products",
      supplierId,
      branchId,
      queryParams,
      supplierCabangId,
    ],
    queryFn: async () => {
      console.log("Fetching supplier products with params:", {
        ...queryParams,
        cabangId: supplierCabangId || branchId,
      });

      // Prepare the query parameters
      const params = { ...queryParams };

      // Only include cabangId if it's a valid value and not "global"
      if (supplierCabangId) {
        params.cabangId = supplierCabangId;
        console.log(
          `Using supplier's cabang_id for product list: ${supplierCabangId}`
        );
      } else if (branchId && branchId !== "global") {
        params.cabangId = branchId;
        console.log(`Using selected branch ID for product list: ${branchId}`);
      } else {
        // Don't send cabangId parameter at all for global suppliers
        console.log("No valid cabangId for product list - omitting parameter");
        delete params.cabangId;
      }

      return produkSupplierService.getProductsBySupplier(supplierId, params);
    },
    enabled: !!supplierId,
    // Wait for supplier data to be loaded before fetching products
    // This ensures we have the correct cabangId
    ...(supplierData ? {} : { enabled: false }),
  });

  // Get branches with access to supplier's products
  const {
    data: branchesWithAccessData,
    isLoading: isLoadingBranchesWithAccess,
    error: branchesWithAccessError,
  } = useQuery({
    queryKey: ["supplier-branches", supplierId],
    queryFn: () =>
      produkSupplierService.getBranchesWithSupplierAccess(supplierId),
    enabled: !!supplierId,
  });

  // Get suppliers for a product
  const {
    data: productSuppliersData,
    isLoading: isLoadingProductSuppliers,
    error: productSuppliersError,
  } = useQuery({
    queryKey: ["product-suppliers", productId, branchId],
    queryFn: () =>
      produkSupplierService.getSuppliersByProduct(productId, branchId),
    enabled: !!productId,
  });

  // Create produk-supplier relationship mutation
  const createProdukSupplierMutation = useMutation({
    mutationFn: (data) => {
      // Don't modify the original data object
      const mutationData = { ...data };

      // First priority: use the supplier's cabangId if available
      if (supplierCabangId) {
        console.log(`Using supplier's cabang_id: ${supplierCabangId}`);
        mutationData.cabangId = supplierCabangId;
      }
      // Second priority: use provided cabangId
      else if (!mutationData.cabangId && branchId) {
        console.log(`Using selected branch ID: ${branchId}`);
        mutationData.cabangId = branchId;
      }
      // Third priority: If supplier has no cabangId, we might need to leave it null/undefined
      // This is a special case for suppliers that are allowed to be used across all branches
      else if (supplierData?.data && !supplierCabangId) {
        console.log(
          "Supplier doesn't have a specific cabang_id - might be global supplier"
        );
        // We don't set a cabangId in this case
      }
      // Log warning if no cabangId is available
      else {
        console.warn("No valid cabangId available - using fallback");
      }

      console.log("Creating product-supplier with data:", mutationData);
      return produkSupplierService.createProdukSupplier(mutationData);
    },
    onSuccess: () => {
      toast.success("Produk berhasil ditambahkan ke supplier");
      queryClient.invalidateQueries(["supplier-products"]);
      queryClient.invalidateQueries(["available-products-for-supplier"]);
      if (productId) {
        queryClient.invalidateQueries(["product-suppliers", productId]);
      }
    },
    onError: (error) => {
      toast.error(
        `Gagal menambahkan produk: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Update produk-supplier relationship mutation
  const updateProdukSupplierMutation = useMutation({
    mutationFn: ({ id, data }) =>
      produkSupplierService.updateProdukSupplier(id, data),
    onSuccess: () => {
      toast.success("Data produk supplier berhasil diperbarui");
      queryClient.invalidateQueries(["supplier-products"]);
      if (productId) {
        queryClient.invalidateQueries(["product-suppliers", productId]);
      }
    },
    onError: (error) => {
      toast.error(
        `Gagal memperbarui data: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  // Delete produk-supplier relationship mutation
  const deleteProdukSupplierMutation = useMutation({
    mutationFn: (id) => produkSupplierService.deleteProdukSupplier(id),
    onSuccess: () => {
      toast.success("Produk berhasil dihapus dari supplier");
      queryClient.invalidateQueries(["supplier-products"]);
      if (productId) {
        queryClient.invalidateQueries(["product-suppliers", productId]);
      }
    },
    onError: (error) => {
      toast.error(
        `Gagal menghapus produk: ${error.message || "Terjadi kesalahan"}`
      );
    },
  });

  return {
    // Data
    supplierProducts: supplierProductsData?.data || [],
    supplierProductsPagination: supplierProductsData?.pagination || {},
    branchesWithAccess: branchesWithAccessData?.data || [],
    productSuppliers: productSuppliersData?.items || [],
    supplierData: supplierData?.data,
    supplierCabangId,

    // Loading states
    isLoadingSupplier,
    isLoadingSupplierProducts,
    isLoadingBranchesWithAccess,
    isLoadingProductSuppliers,
    isCreatingProdukSupplier: createProdukSupplierMutation.isPending,
    isUpdatingProdukSupplier: updateProdukSupplierMutation.isPending,
    isDeletingProdukSupplier: deleteProdukSupplierMutation.isPending,

    // Errors
    supplierProductsError,
    branchesWithAccessError,
    productSuppliersError,

    // Actions
    createProdukSupplier: createProdukSupplierMutation.mutate,
    updateProdukSupplier: updateProdukSupplierMutation.mutate,
    deleteProdukSupplier: deleteProdukSupplierMutation.mutate,
    refetchSupplierProducts,
  };
};
