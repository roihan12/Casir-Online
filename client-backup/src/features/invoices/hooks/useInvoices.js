import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from "@services/api"

/**
 * Hook untuk mengambil daftar invoice dengan filter
 */
export const useInvoiceList = (filters = {}, page = 0, rowsPerPage = 10) => {
  return useQuery({
    queryKey: ['invoices', filters, page, rowsPerPage],
    queryFn: async () => {
      const params = {
        startDate: filters.startDate?.format('YYYY-MM-DD'),
        endDate: filters.endDate?.format('YYYY-MM-DD'),
        cabangId: filters.cabangId !== 'all' ? filters.cabangId : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        search: filters.search || undefined,
        page: page + 1,
        limit: rowsPerPage,
      };

      const response = await api.get(`/invoices`, { params });
      return response.data;
    },
    keepPreviousData: true,
  });
};

/**
 * Hook untuk mengambil detail invoice berdasarkan ID
 */
export const useInvoiceDetail = (id) => {
  return useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },
    enabled: !!id, // Hanya jalankan query jika ID tersedia
  });
};

/**
 * Hook untuk membuat invoice baru dari transaksi
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceData) => {
      const response = await api.post(`/invoices`, invoiceData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

/**
 * Hook untuk memperbarui invoice
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.id] });
    },
  });
};

/**
 * Hook untuk menghapus invoice
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/invoices/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
};

/**
 * Hook untuk mengirim invoice via email
 */
export const useSendInvoice = () => {
  return useMutation({
    mutationFn: async ({ id, email, message }) => {
      const response = await api.post(`/invoices/${id}/send`, { email, message });
      return response.data;
    },
  });
};

/**
 * Hook untuk menghasilkan PDF invoice
 */
export const useGenerateInvoicePdf = (id) => {
  return useQuery({
    queryKey: ['invoicePdf', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      return response.data;
    },
    enabled: false, // Tidak otomatis dijalankan, harus dipanggil secara manual
  });
};
