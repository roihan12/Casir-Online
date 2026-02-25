import { useMutation } from '@tanstack/react-query';
import ocrService from '../../../services/ocrService';
import { toast } from 'react-hot-toast';

export const useMapInvoice = () => {
  return useMutation({
    mutationFn: async (ocrData) => {
      const response = await ocrService.mapInvoice(ocrData);
      return response.data.data;
    },
    onError: (error) => {
      console.error('OCR Mapping Error:', error);
      toast.error(error.response?.data?.message || 'Gagal memetakan data invoice');
    }
  });
};

export const useSaveInvoiceMapping = () => {
  return useMutation({
    mutationFn: async (mappingData) => {
      const response = await ocrService.saveMapping(mappingData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Berhasil menyimpan mapping produk');
    },
    onError: (error) => {
      console.error('Save Mapping Error:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan mapping');
    }
  });
};
