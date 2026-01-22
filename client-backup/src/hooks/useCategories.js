import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoryService } from "../services/categoryService";

export const useCategories = () => {
  const queryClient = useQueryClient();

  // Get all categories
  const getCategories = useQuery({
    queryKey: ["categories"],
    queryFn: categoryService.getAllCategories,
  });

  // Get category by ID
  const getCategoryById = (id) => {
    return useQuery({
      queryKey: ["categories", id],
      queryFn: () => categoryService.getCategoryById(id),
      enabled: !!id, // Only run if id is provided
    });
  };

  // Create category
  const createCategory = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Update category
  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Delete category
  const deleteCategory = useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
