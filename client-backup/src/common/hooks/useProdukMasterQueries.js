import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import produkMasterService from "../services/produkMasterService";
import api from "@common/utils/api";

// Query keys for produk master
export const produkMasterKeys = {
  all: ["produk-master"],
  lists: () => [...produkMasterKeys.all, "list"],
  list: (filters) => [...produkMasterKeys.lists(), { ...filters }],
  details: () => [...produkMasterKeys.all, "detail"],
  detail: (id) => [...produkMasterKeys.details(), id],
};

/**
 * Hook for fetching all produk master with optional filters
 */
export const useProdukMasterList = (filters = {}) => {
  return useQuery({
    queryKey: produkMasterKeys.list(filters),
    queryFn: () => produkMasterService.getAllProdukMaster(filters),
    keepPreviousData: true,
  });
};

/**
 * Hook for fetching a single produk master by ID
 */
export const useProdukMasterDetail = (id, options = {}) => {
  return useQuery({
    queryKey: produkMasterKeys.detail(id),
    queryFn: () => produkMasterService.getProdukMasterById(id),
    ...options,
  });
};

/**
 * Hook for fetching categories
 */
export const useCategories = () => {
  return useQuery({
    queryKey: ["kategori"],
    queryFn: () => produkMasterService.getCategories(),
  });
};

/**
 * Hook for creating a new produk master
 * @returns {Object} Mutation object with mutate function and status
 */
export const useCreateProdukMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, images }) =>
      produkMasterService.createProdukMaster(data, images),
    onSuccess: () => {
      // Invalidate and refetch produk master lists
      queryClient.invalidateQueries({ queryKey: produkMasterKeys.lists() });
    },
  });
};

/**
 * Hook for updating a produk master
 * @returns {Object} Mutation object with mutate function and status
 */
export const useUpdateProdukMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, images }) =>
      produkMasterService.updateProdukMaster(id, data, images),
    onSuccess: (_, variables) => {
      // Invalidate and refetch produk master lists and detail
      queryClient.invalidateQueries({ queryKey: produkMasterKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: produkMasterKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook for deleting a produk master
 * @returns {Object} Mutation object with mutate function and status
 */
export const useDeleteProdukMaster = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => produkMasterService.deleteProdukMaster(id),
    onSuccess: (_, variables) => {
      // Invalidate and refetch produk master lists
      queryClient.invalidateQueries({ queryKey: produkMasterKeys.lists() });
      // Remove from cache
      queryClient.removeQueries({
        queryKey: produkMasterKeys.detail(variables),
      });
    },
  });
};

/**
 * Hook for uploading images to a produk master
 * @returns {Object} Mutation object with mutate function and status
 */
export const useUploadProdukImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, images }) =>
      produkMasterService.uploadProdukImages(id, images),
    onSuccess: (_, variables) => {
      // Invalidate and refetch produk master detail
      queryClient.invalidateQueries({
        queryKey: produkMasterKeys.detail(variables.id),
      });
    },
  });
};

/**
 * Hook for deleting an image from a produk master
 * @returns {Object} Mutation object with mutate function and status
 */
export const useDeleteProdukImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ produkId, imageId }) =>
      produkMasterService.deleteProdukImage(produkId, imageId),
    onSuccess: (_, variables) => {
      // Invalidate and refetch produk master detail
      queryClient.invalidateQueries({
        queryKey: produkMasterKeys.detail(variables.produkId),
      });
    },
  });
};

// Hook for fetching product dashboard data
export const useProdukMasterDashboard = (options = {}) => {
  return useQuery({
    queryKey: ["produkMasterDashboard"],
    queryFn: () => produkMasterService.getDashboardData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options, // Spread options to allow enabled: false, etc.
  });
};
