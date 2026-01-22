import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import userService from "../services/userService";
import roleService from "../../../services/roleService";
import { toast } from "react-hot-toast";

/**
 * useUsers - Hook for managing user data with React Query
 */
export const useUsers = (filters = {}) => {
  const queryClient = useQueryClient();

  // Get users list with filters
  const getUsersQuery = useQuery({
    queryKey: ["users", filters],
    queryFn: () => userService.getUserList(filters),
    keepPreviousData: true,
  });

  // Get user dashboard data
  const getDashboardQuery = (enabled = true) => useQuery({
    queryKey: ["userManagement", "dashboard"],
    queryFn: async () => {
      const response = await userService.getUserDashboard();
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });

  // Get role list for filters
  const getRolesQuery = useQuery({
    queryKey: ["user-management-roles"],
    queryFn: async () => {
      try {
        const response = await roleService.getRoleList();
        return response.data || [];
      } catch (error) {
        console.error("Error fetching role list:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get user by ID
  const getUserById = (id) => useQuery({
    queryKey: ["users", id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  });

  // Create user mutation
  const createUser = useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      toast.success("User berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error(`Gagal menambahkan user: ${error.message}`);
    },
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: ({ id, userData }) => userService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      toast.success("User berhasil diperbarui");
    },
    onError: (error) => {
      toast.error(`Gagal memperbarui user: ${error.message}`);
    },
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userManagement", "dashboard"] });
      toast.success("User berhasil dihapus");
    },
    onError: (error) => {
      toast.error(`Gagal menghapus user: ${error.message}`);
    },
  });

  // Reset password mutation
  const resetPassword = useMutation({
    mutationFn: (id) => userService.resetPassword(id),
    onSuccess: () => {
      toast.success("Password berhasil direset");
    },
    onError: (error) => {
      toast.error(`Gagal mereset password: ${error.message}`);
    },
  });

  return {
    // Queries
    getUsersQuery,
    getDashboardQuery,
    getRolesQuery,
    getUserById,
    // Mutations
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    // Utils
    invalidateUsers: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  };
};

export default useUsers;
