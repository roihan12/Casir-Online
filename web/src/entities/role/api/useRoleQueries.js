import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import roleApi from '@shared/api/roleApi';
import permissionApi from '@shared/api/permissionApi';
import toast from 'react-hot-toast';

export const roleKeys = {
  all: ['roles'],
  lists: () => [...roleKeys.all, 'list'],
  detail: (id) => [...roleKeys.all, 'detail', id],
};

export const permissionKeys = {
  all: ['permissions'],
  lists: () => [...permissionKeys.all, 'list'],
  byRole: (roleId) => [...permissionKeys.all, 'role', roleId],
};

// Roles
export const useRoles = (options = {}) => {
  return useQuery({
    queryKey: roleKeys.lists(),
    queryFn: roleApi.getAll,
    ...options,
  });
};

export const useRole = (id, options = {}) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleApi.getById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role berhasil dibuat');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal membuat role'),
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roleApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success('Role berhasil diupdate');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update role'),
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: roleApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role berhasil dihapus');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal menghapus role'),
  });
};

export const useCloneRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, newRoleName }) => roleApi.clone(roleId, newRoleName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists() });
      toast.success('Role berhasil di-clone');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal clone role'),
  });
};

// Permissions
export const usePermissions = (options = {}) => {
  return useQuery({
    queryKey: permissionKeys.lists(),
    queryFn: permissionApi.getAll,
    ...options,
  });
};

export const useRolePermissions = (roleId, options = {}) => {
  return useQuery({
    queryKey: permissionKeys.byRole(roleId),
    queryFn: () => permissionApi.getByRole(roleId),
    enabled: !!roleId,
    ...options,
  });
};

export const useBulkAssignPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }) => permissionApi.bulkAssign(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.byRole(roleId) });
      toast.success('Permissions berhasil diupdate');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Gagal update permissions'),
  });
};

