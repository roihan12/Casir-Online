import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import shiftService from "../services/shiftService";

// Query keys
export const shiftKeys = {
  all: ["shifts"],
  lists: () => [...shiftKeys.all, "list"],
  list: (filters) => [...shiftKeys.lists(), { ...filters }],
  active: (userId) => [...shiftKeys.all, "active", userId],
  details: () => [...shiftKeys.all, "detail"],
  detail: (id) => [...shiftKeys.details(), id],
  reports: () => [...shiftKeys.all, "report"],
  report: (filters) => [...shiftKeys.reports(), { ...filters }],
};

// Hooks for fetching data
export const useShifts = (filters) => {
  return useQuery({
    queryKey: shiftKeys.list(filters),
    queryFn: () => shiftService.getShifts(filters),
    placeholderData: keepPreviousData,
  });
};

export const useActiveShift = (userId) => {
  return useQuery({
    queryKey: shiftKeys.active(userId),
    queryFn: () => shiftService.getActiveShift(userId),
    enabled: !!userId,
  });
};

export const useShiftDetail = (id) => {
  return useQuery({
    queryKey: shiftKeys.detail(id),
    queryFn: () => shiftService.getShiftById(id),
    enabled: !!id,
  });
};

export const useShiftReport = (filters) => {
  return useQuery({
    queryKey: shiftKeys.report(filters),
    queryFn: () => shiftService.getShiftReport(filters),
    enabled: !!filters?.cabangId,
  });
};

// Hooks for mutations
export const useOpenShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => shiftService.openShift(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.active(data.userId) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
    },
  });
};

export const useCloseShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => shiftService.closeShift(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.active(data.userId) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shiftKeys.reports() });
    },
  });
};

export const useAdjustShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => shiftService.adjustShift(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shiftKeys.reports() });
    },
  });
};

export default {
  useShifts,
  useActiveShift,
  useShiftDetail,
  useShiftReport,
  useOpenShift,
  useCloseShift,
  useAdjustShift,
};
