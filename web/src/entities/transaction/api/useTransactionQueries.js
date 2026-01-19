import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import transaksiApi from '@shared/api/transaksiApi';
import { useBranch } from '@shared/hooks';
import toast from 'react-hot-toast';

export const transaksiKeys = {
  all: ['transaksi'],
  lists: () => [...transaksiKeys.all, 'list'],
  list: (filters) => [...transaksiKeys.lists(), filters],
  details: () => [...transaksiKeys.all, 'detail'],
  detail: (id) => [...transaksiKeys.details(), id],
  salesReport: (filters) => [...transaksiKeys.all, 'salesReport', filters],
};

// Get transactions list
export const useTransactions = (params = {}, options = {}) => {
  const { activeBranchId } = useBranch();
  const filters = { cabangId: activeBranchId, ...params };
  
  return useQuery({
    queryKey: transaksiKeys.list(filters),
    queryFn: () => transaksiApi.getAll(filters),
    enabled: !!activeBranchId,
    ...options,
  });
};

// Get transaction detail
export const useTransaction = (id, options = {}) => {
  return useQuery({
    queryKey: transaksiKeys.detail(id),
    queryFn: () => transaksiApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

// Get sales report
export const useSalesReport = (params = {}, options = {}) => {
  const { activeBranchId } = useBranch();
  const filters = { cabangId: activeBranchId, ...params };
  
  return useQuery({
    queryKey: transaksiKeys.salesReport(filters),
    queryFn: () => transaksiApi.getSalesReport(filters),
    enabled: !!activeBranchId,
    ...options,
  });
};

// Create transaction mutation
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: transaksiApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() });
      toast.success('Transaksi berhasil disimpan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal menyimpan transaksi');
    },
  });
};

// Cancel transaction mutation
export const useCancelTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }) => transaksiApi.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transaksiKeys.detail(id) });
      toast.success('Transaksi berhasil dibatalkan');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal membatalkan transaksi');
    },
  });
};
