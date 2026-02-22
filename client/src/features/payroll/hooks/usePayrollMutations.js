import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollService } from "../services/payrollService";
import { payrollKeys } from "./usePayrollQueries";
import { toast } from "react-hot-toast";

export const useCreateKomponen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.createKomponen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.komponen() });
      toast.success("Komponen gaji berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.response?.data?.error || "Gagal membuat komponen");
    },
  });
};

export const useUpdateKomponen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollService.updateKomponen(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.komponen() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.komponenDetail(id) });
      toast.success("Komponen gaji berhasil diupdate");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal mengupdate komponen");
    },
  });
};

export const useDeleteKomponen = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.deleteKomponen,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.komponen() });
      toast.success("Komponen gaji berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus komponen");
    },
  });
};

export const useCreateTunjangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.createTunjangan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.tunjangan() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.gaji() }); // active tunjangan
      toast.success("Tunjangan berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menambahkan tunjangan");
    },
  });
};

export const useUpdateTunjangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollService.updateTunjangan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.tunjangan() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.gaji() });
      toast.success("Tunjangan berhasil diupdate");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal mengupdate tunjangan");
    },
  });
};

export const useDeleteTunjangan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.deleteTunjangan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.tunjangan() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.gaji() });
      toast.success("Tunjangan berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus tunjangan");
    },
  });
};

export const useUpdateGajiKaryawan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }) => payrollService.updateGajiKaryawan(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.gajiDetail(userId) });
      queryClient.invalidateQueries({ queryKey: payrollKeys.gajiRiwayat(userId) });
      toast.success("Gaji pokok karyawan berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memperbarui gaji karyawan");
    },
  });
};

export const useGenerateSlip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.generateSlip,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.slip() });
      toast.success(`Berhasil generate ${data?.data?.created || 0} slip gaji`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal generate slip gaji");
    },
  });
};

export const useFinalizeSlip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payrollService.finalizeSlip(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.slip() });
      queryClient.invalidateQueries({ queryKey: payrollKeys.slipDetail(id) });
      toast.success("Slip gaji berhasil difinalisasi");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal memfinalisasi slip");
    },
  });
};

export const useBatchFinalizeSlip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.batchFinalizeSlip,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.slip() });
      toast.success(`Berhasil memfinalisasi ${data?.data?.finalized || 0} slip gaji`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal batch finalisasi slip");
    },
  });
};

export const useDeleteSlip = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: payrollService.deleteSlip,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.slip() });
      toast.success("Slip gaji draft berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus slip");
    },
  });
};
