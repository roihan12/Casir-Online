import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import hutangService from "@services/hutangService";

// Query keys
export const hutangKeys = {
  all: ["hutang"],
  lists: () => [...hutangKeys.all, "list"],
  list: (filters) => [...hutangKeys.lists(), { ...filters }],
  details: () => [...hutangKeys.all, "detail"],
  detail: (id) => [...hutangKeys.details(), id],
  summaries: () => [...hutangKeys.all, "summary"],
  summary: (type, id) => [...hutangKeys.summaries(), type, id],
  histories: () => [...hutangKeys.all, "history"],
  history: (hutangId) => [...hutangKeys.histories(), hutangId],
};

/**
 * Get hutang list with filters and pagination
 */
export const useHutangList = (filters = {}) => {
  return useQuery({
    queryKey: hutangKeys.list(filters),
    queryFn: () => hutangService.getHutangList(filters),
    keepPreviousData: true,
  });
};

/**
 * Get hutang by ID
 */
export const useHutangById = (id) => {
  return useQuery({
    queryKey: hutangKeys.detail(id),
    queryFn: () => hutangService.getHutangById(id),
    enabled: !!id,
  });
};

/**
 * Get hutang summary by entity (pelanggan/supplier)
 */
export const useHutangSummary = (type, id) => {
  return useQuery({
    queryKey: hutangKeys.summary(type, id),
    queryFn: () => hutangService.getHutangSummary(type, id),
    enabled: !!type && !!id,
  });
};

/**
 * Get pembayaran history for hutang
 */
export const usePembayaranHistory = (hutangId) => {
  return useQuery({
    queryKey: hutangKeys.history(hutangId),
    queryFn: () => hutangService.getPembayaranHistory(hutangId),
    enabled: !!hutangId,
  });
};

/**
 * Create pembayaran hutang mutation
 */
export const useCreatePembayaran = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => hutangService.createPembayaran(data),
    onSuccess: (data) => {
      toast.success(
        data.hutang?.statusHutang === "lunas"
          ? "Hutang berhasil dilunasi"
          : "Pembayaran berhasil dicatat"
      );
      queryClient.invalidateQueries({ queryKey: hutangKeys.all });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Gagal memproses pembayaran"
      );
    },
  });
};
