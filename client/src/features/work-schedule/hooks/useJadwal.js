import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import jadwalService from "../services/jadwalService";
import toast from "react-hot-toast";

// Keys for React Query
export const jadwalKeys = {
  all: ["jadwal"],
  lists: () => [...jadwalKeys.all, "list"],
  list: (filters) => [...jadwalKeys.lists(), { ...filters }],
  myList: (filters) => [...jadwalKeys.all, "my-list", { ...filters }],
  details: () => [...jadwalKeys.all, "detail"],
  detail: (id) => [...jadwalKeys.details(), id],
};

// Hook to fetch current user's schedules (Staff POV)
export const useMyJadwal = (params = {}) => {
  return useQuery({
    queryKey: jadwalKeys.myList(params),
    queryFn: () => jadwalService.getMyJadwal(params),
    keepPreviousData: true,
  });
};

// Hook to fetch schedules
export const useJadwalList = (params = {}) => {
  return useQuery({
    queryKey: jadwalKeys.list(params),
    queryFn: () => jadwalService.getJadwal(params),
    keepPreviousData: true,
  });
};

// Hook to fetch a single schedule
export const useJadwalDetail = (id) => {
  return useQuery({
    queryKey: jadwalKeys.detail(id),
    queryFn: () => jadwalService.getJadwalById(id),
    enabled: !!id,
  });
};

// Hook to create a schedule
export const useCreateJadwal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => jadwalService.createJadwal(data),
    onSuccess: () => {
      queryClient.invalidateQueries(jadwalKeys.lists());
      toast.success("Jadwal berhasil dibuat");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal membuat jadwal";
      toast.error(message);
    },
  });
};

// Hook to update a schedule
export const useUpdateJadwal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => jadwalService.updateJadwal(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(jadwalKeys.lists());
      queryClient.invalidateQueries(jadwalKeys.detail(variables.id));
      toast.success("Jadwal berhasil diperbarui");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal memperbarui jadwal";
      toast.error(message);
    },
  });
};

// Hook to delete a schedule
export const useDeleteJadwal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => jadwalService.deleteJadwal(id),
    onSuccess: () => {
      queryClient.invalidateQueries(jadwalKeys.lists());
      toast.success("Jadwal berhasil dihapus");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Gagal menghapus jadwal";
      toast.error(message);
    },
  });
};

// Hook to generate schedules in bulk
export const useGenerateJadwalBulk = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => jadwalService.generateJadwalBulk(data),
    onSuccess: () => {
      queryClient.invalidateQueries(jadwalKeys.lists());
      toast.success("Jadwal bulk berhasil dibuat");
    },
    onError: (error) => {
        const message = error.response?.data?.message || "Gagal generate jadwal bulk";
        toast.error(message);
    },
  });
};

// Hook to generate schedules for options (Regu Rolling)
export const useGenerateJadwalRegu = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: (data) => jadwalService.generateJadwalRegu(data),
      onSuccess: () => {
        queryClient.invalidateQueries(jadwalKeys.lists());
        toast.success("Jadwal regu berhasil dibuat");
      },
      onError: (error) => {
          const message = error.response?.data?.message || "Gagal generate jadwal regu";
          toast.error(message);
      },
    });
  };
