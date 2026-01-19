import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userApi from '@shared/api/userApi';
import cabangApi from '@shared/api/cabangApi';
import toast from 'react-hot-toast';

export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (filters) => [...userKeys.lists(), filters],
  detail: (id) => [...userKeys.all, 'detail', id],
};

export const cabangKeys = {
  all: ['cabang'],
  lists: () => [...cabangKeys.all, 'list'],
};

export const useUsers = (params = {}, options = {}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getAll(params),
    ...options,
  });
};

export const useUser = (id, options = {}) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCabang = (options = {}) => {
  return useQuery({
    queryKey: cabangKeys.lists(),
    queryFn: cabangApi.getAll,
    ...options,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat user'),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
      toast.success('User berhasil diupdate');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update user'),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('User berhasil dihapus');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus user'),
  });
};

export const useChangeUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => userApi.changeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success('Status user berhasil diubah');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal mengubah status'),
  });
};

export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, password }) => userApi.resetPassword(id, password),
    onSuccess: () => toast.success('Password berhasil direset'),
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal reset password'),
  });
};

