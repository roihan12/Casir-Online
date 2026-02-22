import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveService } from "../services/leaveService";
import { leaveKeys } from "./useLeaveQueries";
import { toast } from "react-hot-toast";

export const useCreateHariLibur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.createHariLibur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.hariLibur() });
      toast.success("Hari libur berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal menambahkan hari libur");
    },
  });
};

export const useImportHariLibur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.importHariLibur,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.hariLibur() });
      toast.success(`Berhasil import ${data?.data?.created || 0} hari libur`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal import hari libur");
    },
  });
};

export const useDeleteHariLibur = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.deleteHariLibur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.hariLibur() });
      toast.success("Hari libur berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal menghapus hari libur");
    },
  });
};

export const useCreateIzin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.createIzin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.izinCuti() });
      toast.success("Pengajuan izin berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal mengajukan izin");
    },
  });
};

export const useCreateCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.createCuti,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.izinCuti() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.kuotaCuti() });
      toast.success("Pengajuan cuti berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal mengajukan cuti");
    },
  });
};

export const useApproveIzinCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveService.approveIzinCuti(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.izinCuti() });
      queryClient.invalidateQueries({ queryKey: leaveKeys.kuotaCuti() });
      toast.success("Pengajuan berhasil disetujui");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal menyetujui pengajuan");
    },
  });
};

export const useRejectIzinCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveService.rejectIzinCuti(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.izinCuti() });
      toast.success("Pengajuan berhasil ditolak");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal menolak pengajuan");
    },
  });
};

export const useCancelIzinCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.cancelIzinCuti,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.izinCuti() });
      toast.success("Pengajuan berhasil dibatalkan");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal membatalkan pengajuan");
    },
  });
};

export const useGenerateKuotaCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: leaveService.generateKuotaCuti,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.kuotaCuti() });
      toast.success(`Berhasil generate ${data?.data?.created || 0} kuota cuti`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal generate kuota cuti");
    },
  });
};

export const useAdjustKuotaCuti = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => leaveService.adjustKuotaCuti(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveKeys.kuotaCuti() });
      toast.success("Kuota cuti berhasil diubah");
    },
    onError: (error) => {
      toast.error(error.response?.data?.errors || error.response?.data?.message || "Gagal mengubah kuota cuti");
    },
  });
};
