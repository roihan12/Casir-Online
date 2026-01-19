import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import produkApi from '@shared/api/produkApi';
import { useBranch } from '@shared/hooks';
import toast from 'react-hot-toast';

export const produkKeys = {
  all: ['produk'],
  lists: () => [...produkKeys.all, 'list'],
  list: (filters) => [...produkKeys.lists(), filters],
  details: () => [...produkKeys.all, 'detail'],
  detail: (id) => [...produkKeys.details(), id],
  search: (cabangId, query) => [...produkKeys.all, 'search', cabangId, query],
  lowStock: (cabangId) => [...produkKeys.all, 'lowStock', cabangId],
  frequent: (cabangId) => [...produkKeys.all, 'frequent', cabangId],
};

// Get products list with pagination
export const useProducts = (params = {}, options = {}) => {
  const { activeBranchId } = useBranch();
  const filters = { cabangId: activeBranchId, ...params };
  
  return useQuery({
    queryKey: produkKeys.list(filters),
    queryFn: () => produkApi.getAll(filters),
    enabled: !!activeBranchId,
    ...options,
  });
};

// Search products
export const useProductSearch = (query, options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: produkKeys.search(activeBranchId, query),
    queryFn: () => produkApi.search(activeBranchId, query),
    enabled: !!activeBranchId && !!query && query.length >= 2,
    ...options,
  });
};

// Get product detail
export const useProduct = (id, options = {}) => {
  return useQuery({
    queryKey: produkKeys.detail(id),
    queryFn: () => produkApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Get low stock products
export const useLowStockProducts = (options = {}) => {
  const { activeBranchId } = useBranch();
  
  return useQuery({
    queryKey: produkKeys.lowStock(activeBranchId),
    queryFn: () => produkApi.getLowStock(activeBranchId),
    enabled: !!activeBranchId,
    ...options,
  });
};

// Create product mutation
export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: produkApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      toast.success('Produk berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan produk');
    },
  });
};

// Update product mutation
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => produkApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      queryClient.invalidateQueries({ queryKey: produkKeys.detail(id) });
      toast.success('Produk berhasil diupdate');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal mengupdate produk');
    },
  });
};

// Update stock mutation
export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => produkApi.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: produkKeys.lists() });
      toast.success('Stok berhasil diupdate');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal mengupdate stok');
    },
  });
};
