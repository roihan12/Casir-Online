import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from "@common/utils/api";

/**
 * Hook untuk mengambil daftar transaksi dengan filter
 */
export const useTransactionsList = (filters = {}, page = 0, rowsPerPage = 10) => {
  return useQuery({
    queryKey: ['transactions', filters, page, rowsPerPage],
    queryFn: async () => {
      const params = {
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD'),
        cabangId: filters.cabangId !== 'all' ? filters.cabangId : undefined,
        jenisTransaksi: filters.jenisTransaksi !== 'all' ? filters.jenisTransaksi : undefined,
        statusPembayaran: filters.statusPembayaran !== 'all' ? filters.statusPembayaran : undefined,
        search: filters.search || undefined,
        page: page + 1,
        limit: rowsPerPage,
      };

      const response = await api.get(`/transaksi`, { params });
      return response.data.data;
    },
    keepPreviousData: true,
  });
};

/**
 * Hook untuk mengambil detail transaksi berdasarkan ID
 */
export const useTransactionDetail = (id) => {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/transaksi/${id}`);
      return response.data.data;
    },
    enabled: !!id, // Hanya jalankan query jika ID tersedia
  });
};

/**
 * Hook untuk mengambil data dashboard transaksi
 */
export const useTransactionDashboard = (timeRange = '30d', filters = {}) => {
  return useQuery({
    queryKey: ['transactionDashboard', timeRange, filters],
    queryFn: async () => {
      // Map timeRange to date range if not using custom date range
      let startDate = filters.startDate;
      let endDate = filters.endDate;
      
      if (!startDate || !endDate) {
        const now = new Date();
        endDate = new Date(now);
        
        if (timeRange === '1d') {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        } else if (timeRange === '7d') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (timeRange === '30d') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 30);
        } else if (timeRange === '90d') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 90);
        } else if (timeRange === '1y') {
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
        }
      }
      
      // Format parameters according to the API expectations
      const params = {
        cabang_id: filters.cabangId !== 'all' ? filters.cabangId : undefined,
        tanggal_mulai: startDate ? (startDate.format ? startDate.format('YYYY-MM-DD') : startDate.toISOString().split('T')[0]) : undefined,
        tanggal_akhir: endDate ? (endDate.format ? endDate.format('YYYY-MM-DD') : endDate.toISOString().split('T')[0]) : undefined,
      };

      const response = await api.get(`/transaction-dashboard`, { params });
      return response.data.data;
    },
  });
};

/**
 * Hook untuk membatalkan transaksi
 */
export const useCancelTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId) => {
      const response = await api.put(`/transaksi/${transactionId}/cancel`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', variables] });
      queryClient.invalidateQueries({ queryKey: ['transactionDashboard'] });
    },
  });
};

/**
 * Hook untuk menambahkan pembayaran
 */
export const useAddPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await api.post(`/transaksi/payment`, paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', data.transaksi_id] });
      queryClient.invalidateQueries({ queryKey: ['transactionDashboard'] });
    },
  });
};

/**
 * Hook untuk membuat pembayaran QRIS
 */
export const useCreateQrisPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (qrisData) => {
      const response = await api.post(`/transaksi/payment/qris`, qrisData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', data.transaksi_id] });
    },
  });
};
