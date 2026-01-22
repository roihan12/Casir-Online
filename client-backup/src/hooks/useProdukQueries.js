import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import { z } from "zod";

// Updated Validation schemas with all filter parameters
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
});

const useProdukQueries = () => {
  const queryClient = useQueryClient();
  const API_URL = "/produk"; // Adjust based on your API URL structure

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
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(validatedFilters).forEach(([key, value]) => {
          if (value !== undefined) {
            // Handle date objects properly
            if (value instanceof Date) {
              params.append(key, value.toISOString());
            } else {
              params.append(key, String(value));
            }
          }
        });

        const { data } = await api.get(`${API_URL}?${params.toString()}`);
        return data;
      },
      placeholderData: (previousData) => previousData,
    });
  };

  // GET PRODUCT BY ID
  const useProductById = (id) => {
    return useQuery({
      queryKey: ["product", id],
      queryFn: async () => {
        if (!id) return null;
        const { data } = await api.get(`${API_URL}/${id}`);
        return data;
      },
      enabled: !!id,
    });
  };

  // GET PRODUCT BY MASTER AND BRANCH
  const useProductByMasterAndBranch = (produkMasterId, cabangId) => {
    return useQuery({
      queryKey: ["product", produkMasterId, cabangId],
      queryFn: async () => {
        if (!produkMasterId || !cabangId) return null;
        const { data } = await api.get(
          `${API_URL}/master/${produkMasterId}/cabang/${cabangId}`
        );
        return data;
      },
      enabled: !!produkMasterId && !!cabangId,
    });
  };

  // CREATE PRODUCT
  const useCreateProduct = () => {
    return useMutation({
      mutationFn: async (productData) => {
        const validatedData = ProdukCreateSchema.parse(productData);
        const { data } = await api.post(API_URL, validatedData);
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["products"],
        });
      },
    });
  };

  // UPDATE PRODUCT
  const useUpdateProduct = () => {
    return useMutation({
      mutationFn: async ({ id, data }) => {
        const validatedData = ProdukUpdateSchema.parse(data);
        const { data: response } = await api.put(
          `${API_URL}/${id}`,
          validatedData
        );
        return response;
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
      mutationFn: async ({ id, data }) => {
        const validatedData = StokUpdateSchema.parse(data);
        const { data: response } = await api.patch(
          `${API_URL}/${id}/stock`,
          validatedData
        );
        return response;
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
      queryFn: async () => {
        if (!produkId) return null;

        const params = new URLSearchParams();
        Object.entries(validatedPagination).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });

        const { data } = await api.get(
          `${API_URL}/${produkId}/inventory-movements?${params.toString()}`
        );
        return data;
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
      queryFn: async () => {
        if (!produkId) return null;

        const params = new URLSearchParams();
        Object.entries(validatedPagination).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });

        const { data } = await api.get(
          `${API_URL}/${produkId}/price-history?${params.toString()}`
        );
        return data;
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
      queryFn: async () => {
        if (!cabangId) return null;

        const params = new URLSearchParams();
        Object.entries(validatedPagination).forEach(([key, value]) => {
          if (value !== undefined) params.append(key, String(value));
        });

        const { data } = await api.get(
          `${API_URL}/low-stock/${cabangId}?${params.toString()}`
        );
        return data;
      },
      enabled: !!cabangId,
      placeholderData: (previousData) => previousData,
    });
  };

  return {
    useAllProducts,
    useProductById,
    useProductByMasterAndBranch,
    useCreateProduct,
    useUpdateProduct,
    useUpdateStock,
    useInventoryMovements,
    usePriceHistory,
    useLowStockProducts,
  };
};

export default useProdukQueries;
