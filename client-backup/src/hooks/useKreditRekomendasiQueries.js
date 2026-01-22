import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getCustomerCreditScore, 
  getKreditPaymentRecommendation, 
  createKreditRekomendasi,
  getKreditRekomendasiById,
  getKreditRekomendasiByPelanggan,
  approveKreditRekomendasi,
  getKreditRekomendasiList,
  createKreditTransaction
} from "../services/kreditRekomendasiService";
import { toast } from "react-hot-toast";

// Hook untuk mendapatkan skor kredit pelanggan
export const useCustomerCreditScore = (pelangganId, options = {}) => {
  return useQuery({
    queryKey: ["customerCreditScore", pelangganId],
    queryFn: () => getCustomerCreditScore(pelangganId),
    enabled: !!pelangganId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook untuk mendapatkan rekomendasi pembayaran kredit untuk transaksi
export const useKreditPaymentRecommendation = (transaksiId, options = {}) => {
  return useQuery({
    queryKey: ["kreditPaymentRecommendation", transaksiId],
    queryFn: () => getKreditPaymentRecommendation(transaksiId),
    enabled: !!transaksiId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook untuk membuat rekomendasi kredit
export const useCreateKreditRekomendasi = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => createKreditRekomendasi(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["kreditRekomendasiList"] });
      queryClient.invalidateQueries({ 
        queryKey: ["kreditRekomendasiByPelanggan", data.data.pelanggan_id] 
      });
      toast.success("Rekomendasi kredit berhasil dibuat");
    },
    onError: (error) => {
      toast.error(`Gagal membuat rekomendasi kredit: ${error.response?.data?.message || error.message}`);
    }
  });
};

// Hook untuk mendapatkan rekomendasi kredit berdasarkan ID
export const useKreditRekomendasiDetail = (id, options = {}) => {
  return useQuery({
    queryKey: ["kreditRekomendasiDetail", id],
    queryFn: () => getKreditRekomendasiById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook untuk mendapatkan rekomendasi kredit berdasarkan ID pelanggan
export const useKreditRekomendasiByPelanggan = (pelangganId, options = {}) => {
  return useQuery({
    queryKey: ["kreditRekomendasiByPelanggan", pelangganId],
    queryFn: () => getKreditRekomendasiByPelanggan(pelangganId),
    enabled: !!pelangganId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook untuk menyetujui atau menolak rekomendasi kredit
export const useApproveKreditRekomendasi = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => approveKreditRekomendasi(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kreditRekomendasiList"] });
      queryClient.invalidateQueries({ queryKey: ["kreditRekomendasiDetail", variables.id] });
      
      const action = variables.data.status_persetujuan === "disetujui" ? "disetujui" : "ditolak";
      toast.success(`Rekomendasi kredit berhasil ${action}`);
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui status rekomendasi kredit: ${error.response?.data?.message || error.message}`);
    }
  });
};

// Hook untuk mendapatkan daftar rekomendasi kredit dengan filter
export const useKreditRekomendasiList = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["kreditRekomendasiList", params],
    queryFn: () => getKreditRekomendasiList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
};

// Hook untuk membuat transaksi kredit
export const useCreateKreditTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => createKreditTransaction(data),
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["transaksiDetail", data.data.transaksi.transaksi_id] });
      queryClient.invalidateQueries({ queryKey: ["transaksiList"] });
      queryClient.invalidateQueries({ queryKey: ["kreditRekomendasiDetail", data.data.kredit_rekomendasi.id] });
      
      toast.success("Transaksi kredit berhasil dibuat");
    },
    onError: (error) => {
      toast.error(`Gagal membuat transaksi kredit: ${error.response?.data?.message || error.message}`);
    }
  });
};
