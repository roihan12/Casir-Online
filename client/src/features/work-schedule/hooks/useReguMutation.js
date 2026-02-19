import { useMutation, useQueryClient } from "@tanstack/react-query";
import reguService from "../../../services/reguService";
import { reguKeys } from "./useRegu";
import { toast } from "react-hot-toast";

export const useCreateRegu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reguService.createRegu(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      toast.success("Regu berhasil dibuat");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal membuat regu");
    },
  });
};

export const useUpdateRegu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => reguService.updateRegu(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reguKeys.detail(id) });
      toast.success("Regu berhasil diupdate");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal mengupdate regu");
    },
  });
};

export const useDeleteRegu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => reguService.deleteRegu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      toast.success("Regu berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal menghapus regu");
    },
  });
};

export const useAddReguMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reguId, userIds }) => reguService.addMembers(reguId, userIds),
    onSuccess: (data, { reguId }) => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reguKeys.detail(reguId) });
      toast.success(data.message || "Anggota berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal menambahkan anggota");
    },
  });
};

export const useRemoveReguMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reguId, userIds }) => reguService.removeMembers(reguId, userIds),
    onSuccess: (data, { reguId }) => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reguKeys.detail(reguId) });
      toast.success(data.message || "Anggota berhasil dihapus");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal menghapus anggota");
    },
  });
};

export const useMoveReguMembers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => reguService.moveMembers(data),
    onSuccess: (data, { fromReguId, toReguId }) => {
      queryClient.invalidateQueries({ queryKey: reguKeys.lists() });
      queryClient.invalidateQueries({ queryKey: reguKeys.detail(fromReguId) });
      queryClient.invalidateQueries({ queryKey: reguKeys.detail(toReguId) });
      toast.success(data.message || "Anggota berhasil dipindah");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Gagal memindah anggota");
    },
  });
};
