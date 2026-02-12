import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import permissionService from "../services/permissionService";
import { toast } from "react-hot-toast";

export const permissionKeys = {
  all: ["permissions"],
  list: () => [...permissionKeys.all, "list"],
  byRole: (roleId) => [...permissionKeys.all, "role", roleId],
};

export const usePermissions = (options = {}) => {
  return useQuery({
    queryKey: permissionKeys.list(),
    queryFn: permissionService.getAll,
    ...options,
  });
};

export const useRolePermissions = (roleId, options = {}) => {
  return useQuery({
    queryKey: permissionKeys.byRole(roleId),
    queryFn: () => permissionService.getByRole(roleId),
    enabled: !!roleId,
    ...options,
  });
};

export const useCreatePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => permissionService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      toast.success("Permission created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create permission: ${error.message}`);
    },
  });
};

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => permissionService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      toast.success("Permission updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update permission: ${error.message}`);
    },
  });
};

export const useDeletePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => permissionService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.all });
      toast.success("Permission deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete permission: ${error.message}`);
    },
  });
};

export const useBulkAssignPermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }) => permissionService.bulkAssign(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.byRole(roleId) });
      toast.success("Permissions updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update permissions: ${error.message}`);
    },
  });
};
