import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@common/utils/api";
import { z } from "zod";
import produkService from "../services/produkService";

// ... (existing constants)
const ProdukFilterSchema = z.object({
  search: z.string().optional(),
  produkMasterId: z.string().optional(),
  cabangId: z.string().optional(),
  status: z.string().optional(),
  minHarga: z.number().optional(),
  maxHarga: z.number().optional(),
  minStok: z.number().optional(),
  maxStok: z.number().optional(),
  kategoriId: z.string().optional(),
  createdAfter: z.string().optional(), // Date string
  createdBefore: z.string().optional(), // Date string
  updatedAfter: z.string().optional(), // Date string
  updatedBefore: z.string().optional(), // Date string
  sortBy: z.string().optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

const ProdukCreateSchema = z.object({
  produkMasterId: z.string(),
  cabangId: z.string(),
  hargaBeli: z.number().nonnegative(),
  hargaJual: z.number().nonnegative(),
  hargaGrosir: z.number().nonnegative().optional(),
  stok: z.number().nonnegative().optional().default(0),
  minStok: z.number().nonnegative().optional(),
  maxStok: z.number().nonnegative().optional(),
  status: z.enum(["tersedia", "tidak_tersedia"]).optional().default("tersedia"),
});

const ProdukUpdateSchema = z.object({
  hargaBeli: z.number().nonnegative(),
  hargaJual: z.number().nonnegative(),
  hargaGrosir: z.number().nonnegative().optional(),
  minStok: z.number().nonnegative().optional(),
  maxStok: z.number().nonnegative().optional(),
  status: z.enum(["tersedia", "tidak_tersedia"]),
  alasanPerubahan: z.string().optional(),
  dokumenReferensi: z.string().optional(),
  supplierId: z.string().optional(),
});

const StokUpdateSchema = z.object({
  quantity: z.number(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  batchNumber: z.string().optional(),
  expiredDate: z.date().optional(),
  keterangan: z.string().optional(),
});

const PaginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
  search: z.string().optional(),
});

const useProdukQueries = () => {
  const queryClient = useQueryClient();

  // GET ALL PRODUCTS - Updated with all filter parameters
  const useAllProducts = (filters = {}) => {
    // Convert string numbers to actual numbers for numeric filters
    const preparedFilters = { ...filters };

    // Convert string numbers to actual numbers if they exist
    ["minHarga", "maxHarga", "minStok", "maxStok", "page", "limit"].forEach(
      (key) => {
        if (preparedFilters[key] !== undefined && preparedFilters[key] !== "") {
          preparedFilters[key] = Number(preparedFilters[key]);
        }
      }
    );

    const validatedFilters = ProdukFilterSchema.parse(preparedFilters);

    return useQuery({
      queryKey: ["products", validatedFilters],
      queryFn: () => produkService.getAllProduk(validatedFilters),
      placeholderData: (previousData) => previousData,
    });
  };

  // GET PRODUCT BY ID
  const useProductById = (id) => {
    return useQuery({
      queryKey: ["product", id],
      queryFn: () => {
        if (!id) return null;
        return produkService.getProdukById(id);
      },
      enabled: !!id,
    });
  };

  // GET PRODUCT BY MASTER AND BRANCH
  const useProductByMasterAndBranch = (produkMasterId, cabangId) => {
    return useQuery({
      queryKey: ["product", produkMasterId, cabangId],
      queryFn: () => {
        if (!produkMasterId || !cabangId) return null;
        return api.get(`/produk/master/${produkMasterId}/cabang/${cabangId}`).then(res => res.data);
      },
      enabled: !!produkMasterId && !!cabangId,
    });
  };

  // GET PRODUCT TEMPLATES
  const useProductTemplates = (cabangId) => {
    return useQuery({
      queryKey: ["templates", cabangId],
      queryFn: () => produkService.getProductTemplates(cabangId),
      enabled: !!cabangId,
    });
  };

  // GET PRODUCT RECOMMENDATIONS
  const useProductRecommendations = (cabangId, filters = {}) => {
    const validatedFilters = PaginationSchema.parse(filters);
    return useQuery({
      queryKey: ["recommendations", cabangId, validatedFilters],
      queryFn: () => produkService.getProductRecommendations(cabangId, validatedFilters),
      enabled: !!cabangId,
      placeholderData: (previousData) => previousData,
    });
  };

  // CREATE PRODUCT
  const useCreateProduct = () => {
    return useMutation({
      mutationFn: (productData) => {
        const validatedData = ProdukCreateSchema.parse(productData);
        return produkService.createProduk(validatedData);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["products"],
        });
      },
    });
  };

  // BULK ADD PRODUCTS
  const useBulkAddProducts = (cabangId) => {
    return useMutation({
      mutationFn: (productsData) => produkService.bulkAddProducts(cabangId, productsData).then(res => res.data),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["products", cabangId],
        });
      },
    });
  };

  // UPDATE PRODUCT
  const useUpdateProduct = () => {
    return useMutation({
      mutationFn: ({ id, data }) => {
        const validatedData = ProdukUpdateSchema.parse(data);
        return produkService.updateProduk(id, validatedData);
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["products"],
        });
        queryClient.invalidateQueries({
          queryKey: ["product", data.id],
        });
      },
    });
  };

  // UPDATE STOCK
  const useUpdateStock = () => {
    return useMutation({
      mutationFn: ({ id, data }) => {
        const validatedData = StokUpdateSchema.parse(data);
        return produkService.updateStok(id, validatedData);
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: ["products"],
        });
        queryClient.invalidateQueries({
          queryKey: ["product", data.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["inventory-movements", data.id],
        });
        queryClient.invalidateQueries({
          queryKey: ["low-stock-products"],
        });
      },
    });
  };

  // GET INVENTORY MOVEMENTS
  const useInventoryMovements = (produkId, pagination = {}) => {
    const validatedPagination = PaginationSchema.parse(pagination);

    return useQuery({
      queryKey: ["inventory-movements", produkId, validatedPagination],
      queryFn: () => {
        if (!produkId) return null;
        return produkService.getInventoryMovements(produkId, validatedPagination);
      },
      enabled: !!produkId,
      placeholderData: (previousData) => previousData,
    });
  };

  // GET PRICE HISTORY
  const usePriceHistory = (produkId, pagination = {}) => {
    const validatedPagination = PaginationSchema.parse(pagination);

    return useQuery({
      queryKey: ["price-history", produkId, validatedPagination],
      queryFn: () => {
        if (!produkId) return null;
        return produkService.getPriceHistory(produkId, validatedPagination);
      },
      enabled: !!produkId,
      placeholderData: (previousData) => previousData,
    });
  };

  // GET LOW STOCK PRODUCTS
  const useLowStockProducts = (cabangId, pagination = {}) => {
    const validatedPagination = PaginationSchema.parse(pagination);

    return useQuery({
      queryKey: ["low-stock-products", cabangId, validatedPagination],
      queryFn: () => {
        if (!cabangId) return null;
        const params = new URLSearchParams();
        Object.entries(validatedPagination).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });
        return api.get(`/produk/reports/low-stock/${cabangId}?${params.toString()}`).then(res => res.data);
      },
      enabled: !!cabangId,
      placeholderData: (previousData) => previousData,
    });
  };

  return {
    useAllProducts,
    useProductById,
    useProductByMasterAndBranch,
    useProductTemplates,
    useProductRecommendations,
    useCreateProduct,
    useBulkAddProducts,
    useUpdateProduct,
    useUpdateStock,
    useInventoryMovements,
    usePriceHistory,
    useLowStockProducts,
  };
};

export default useProdukQueries;
