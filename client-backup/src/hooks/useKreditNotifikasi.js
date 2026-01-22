import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import kreditNotifikasiService from '../services/kreditNotifikasiService';
import { toast } from 'react-hot-toast';

/**
 * Hook untuk mendapatkan daftar notifikasi kredit
 * @param {Object} filters - Filter untuk notifikasi kredit
 * @param {Object} options - Opsi tambahan untuk query
 * @returns {Object} - Query result
 */
export const useKreditNotifikasiList = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['kreditNotifikasi', filters],
    queryFn: () => kreditNotifikasiService.getKreditNotifikasi(filters),
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 10, // 10 menit
    ...options,
  });
};

/**
 * Hook untuk membuat notifikasi kredit baru
 * @returns {Object} - Mutation result
 */
export const useCreateKreditNotifikasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => kreditNotifikasiService.createKreditNotifikasi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      toast.success('Notifikasi kredit berhasil dibuat');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal membuat notifikasi kredit');
      throw error;
    },
  });
};

/**
 * Hook untuk mengirim notifikasi kredit
 * @returns {Object} - Mutation result
 */
export const useSendKreditNotifikasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => kreditNotifikasiService.sendKreditNotifikasi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      toast.success('Notifikasi kredit berhasil dikirim');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim notifikasi kredit');
      throw error;
    },
  });
};

/**
 * Hook untuk menandai notifikasi kredit telah dibaca
 * @returns {Object} - Mutation result
 */
export const useMarkNotifikasiRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => kreditNotifikasiService.markNotifikasiRead(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['kreditNotifikasi'] });
      
      const previousData = queryClient.getQueryData(['kreditNotifikasi']);
      
      queryClient.setQueryData(['kreditNotifikasi'], (old) => {
        if (!old || !old.data) return old;
        
        return {
          ...old,
          data: old.data.map((notifikasi) => {
            if (notifikasi.id === id) {
              return {
                ...notifikasi,
                dibaca: true,
                dibacaPada: new Date().toISOString(),
              };
            }
            return notifikasi;
          }),
        };
      });
      
      return { previousData };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      return data;
    },
    onError: (error, id, context) => {
      queryClient.setQueryData(['kreditNotifikasi'], context.previousData);
      toast.error(error.response?.data?.message || 'Gagal menandai notifikasi sebagai dibaca');
      throw error;
    },
  });
};

/**
 * Hook untuk membatalkan notifikasi kredit
 * @returns {Object} - Mutation result
 */
export const useCancelKreditNotifikasi = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => kreditNotifikasiService.cancelKreditNotifikasi(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      toast.success('Notifikasi kredit berhasil dibatalkan');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal membatalkan notifikasi kredit');
      throw error;
    },
  });
};

/**
 * Hook untuk membuat notifikasi pengingat pembayaran kredit otomatis
 * @returns {Object} - Mutation result
 */
export const useCreatePaymentReminderNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (options) => kreditNotifikasiService.createPaymentReminderNotifications(options),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      toast.success(`${data.data.length} notifikasi pengingat pembayaran kredit berhasil dibuat`);
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal membuat notifikasi pengingat pembayaran');
      throw error;
    },
  });
};

/**
 * Hook untuk mengirim semua notifikasi kredit yang belum dikirim
 * @returns {Object} - Mutation result
 */
export const useSendPendingNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => kreditNotifikasiService.sendPendingNotifications(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['kreditNotifikasi'] });
      toast.success(`${data.data.length} notifikasi kredit berhasil dikirim`);
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Gagal mengirim notifikasi tertunda');
      throw error;
    },
  });
};
