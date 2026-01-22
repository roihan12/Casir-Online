import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import cabangService from "../services/cabangService";

// Query keys
export const cabangKeys = {
  all: ["cabang"],
  lists: () => [...cabangKeys.all, "list"],
  list: (filters) => [...cabangKeys.lists(), { ...filters }],
  details: () => [...cabangKeys.all, "detail"],
  detail: (id) => [...cabangKeys.details(), id],
  stats: () => [...cabangKeys.all, "stats"],
  stat: (id) => [...cabangKeys.stats(), id],
};

// Hooks for fetching data
export const useCabangList = (page = 1, itemsPerPage = 10) => {
  return useQuery({
    queryKey: cabangKeys.list({ page, itemsPerPage }),
    queryFn: () => cabangService.getCabangList(page, itemsPerPage),
    keepPreviousData: true,
  });
};

export const useCabangById = (id) => {
  return useQuery({
    queryKey: cabangKeys.detail(id),
    queryFn: () => cabangService.getCabangById(id),
    enabled: !!id,
  });
};

export const useCabangStats = (id = null) => {
  return useQuery({
    queryKey: cabangKeys.stat(id),
    queryFn: () => cabangService.getCabangStats(id),
  });
};

// Hooks for mutations
export const useCreateCabang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cabangData) => cabangService.createCabang(cabangData),
    onSuccess: () => {
      // Invalidate and refetch cabang lists
      queryClient.invalidateQueries({ queryKey: cabangKeys.lists() });
    },
  });
};

export const useUpdateCabang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => cabangService.updateCabang(id, data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch cabang lists and details
      queryClient.invalidateQueries({ queryKey: cabangKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: cabangKeys.detail(variables.id),
      });
    },
  });
};

export const useDeleteCabang = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => cabangService.deleteCabang(id),
    onSuccess: (_, id) => {
      // Invalidate and refetch cabang lists and details
      queryClient.invalidateQueries({ queryKey: cabangKeys.lists() });
      queryClient.invalidateQueries({ queryKey: cabangKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: cabangKeys.stats() });
    },
  });
};

export const useUpdateCabangStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      cabangService.updateCabangStatus(id, status),
    onSuccess: (data, variables) => {
      // Invalidate and refetch cabang lists and details
      queryClient.invalidateQueries({ queryKey: cabangKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: cabangKeys.detail(variables.id),
      });
    },
  });
};
