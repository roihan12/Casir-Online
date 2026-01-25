import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import roleService from "../services/roleService";
import { toast } from "react-hot-toast";

export const roleKeys = {
  all: ["roles"],
  list: () => [...roleKeys.all, "list"],
  detail: (id) => [...roleKeys.all, "detail", id],
};

export const useRoles = (options = {}) => {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: roleService.getAllRoles,
    ...options,
  });
};

export const useRoleDetail = (id, options = {}) => {
  return useQuery({
    queryKey: roleKeys.detail(id),
    queryFn: () => roleService.getRoleById(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => roleService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success("Role created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create role: ${error.message}`);
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roleService.updateRole(id, data),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.all });
      toast.success("Role deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete role: ${error.message}`);
    },
  });
};
