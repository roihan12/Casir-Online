import api from "./api";

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with a status code outside the 2xx range
    throw new Error(
      error.response.data.message || "Terjadi kesalahan pada server"
    );
  } else if (error.request) {
    // Request was made but no response received
    throw new Error("Tidak dapat menghubungi server");
  } else {
    // Error in setting up the request
    throw new Error("Terjadi kesalahan");
  }
};

export const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await api.get(`/kategori`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await api.get(`/kategori/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Create new category
  createCategory: async (data) => {
    try {
      const response = await api.post(`/kategori`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Update category
  updateCategory: async (id, data) => {
    try {
      const response = await api.put(`/kategori/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      const response = await api.delete(`/kategori/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};
