import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import supplierService from "../services/supplierService";
import toast from "react-hot-toast";

// Query keys
export const supplierKeys = {
  all: ["supplier"],
  lists: () => [...supplierKeys.all, "list"],
  list: (filters) => [...supplierKeys.lists(), { ...filters }],
  details: () => [...supplierKeys.all, "detail"],
  detail: (id) => [...supplierKeys.details(), id],
  stats: () => [...supplierKeys.all, "stats"],
  stat: (cabangId) => [...supplierKeys.stats(), cabangId],
};

import { keepPreviousData } from "@tanstack/react-query";

// Get supplier list with filters and pagination
export const useSupplierList = (filters = {}) => {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => supplierService.getAllSuppliers(filters),
    placeholderData: keepPreviousData,
  });
};

// Get supplier by ID
export const useSupplierById = (id) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierService.getSupplierDetail(id),
    enabled: !!id,
  });
};

// Get supplier dashboard statistics
export const useSupplierStats = (cabangId = "") => {
  return useQuery({
    queryKey: supplierKeys.stat(cabangId),
    queryFn: () => supplierService.getSupplierDashboardStats(cabangId),
  });
};

// Create supplier mutation
export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => supplierService.createSupplier(data),
    onSuccess: () => {
      toast.success("Supplier berhasil ditambahkan");
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats() });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal menambahkan supplier"
      );
    },
  });
};

// Update supplier mutation
export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => supplierService.updateSupplier(id, data),
    onSuccess: (_, variables) => {
      toast.success("Supplier berhasil diperbarui");
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats() });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal memperbarui supplier"
      );
    },
  });
};

// Delete supplier mutation
export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => supplierService.deleteSupplier(id),
    onSuccess: () => {
      toast.success("Supplier berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats() });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Gagal menghapus supplier");
    },
  });
};

// Change supplier status mutation
export const useChangeSupplierStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) =>
      supplierService.changeSupplierStatus(id, status),
    onSuccess: (_, variables) => {
      toast.success(
        `Status supplier berhasil diubah menjadi ${
          variables.status === "aktif" ? "aktif" : "nonaktif"
        }`
      );
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: supplierKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: supplierKeys.stats() });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Gagal mengubah status supplier"
      );
    },
  });
};
