import { useMutation, useQueryClient } from "@tanstack/react-query";
import jadwalService from "../services/jadwalService";
import { jadwalKeys } from "./useJadwal";
import { toast } from "react-hot-toast";

export const useBulkGenerateJadwal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => jadwalService.generateJadwalBulk(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jadwalKeys.all });
      toast.success(data.message || "Bulk generate berhasil");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal melakukan bulk generate");
    },
  });
};

export const useReguRollingGenerateJadwal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => jadwalService.generateJadwalRegu(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: jadwalKeys.all });
      toast.success(data.message || "Generate regu rolling berhasil");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal melakukan generate regu rolling");
    },
  });
};
