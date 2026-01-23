import api from "@common/utils/api";

// Service for ProdukMaster API
const produkMasterService = {
  // Get all produk master with optional filters
  async getAllProdukMaster(params = {}) {
    const response = await api.get("/produk-master", { params });
    return response.data;
  },

  // Get produk master by ID
  async getProdukMasterById(id) {
    const response = await api.get(`/produk-master/${id}`);
    return response.data.data;
  },

  // Get dashboard data
  async getDashboardData() {
    const response = await api.get("/product-dashboard");
    return response.data;
  },

  async getDashboardDataStats() {
    const response = await api.get("/product-master-dashboard/stats");
    return response.data;
  },

  // Get categories for dropdown
  async getCategories() {
    try {
      const response = await api.get("/kategori");
      // Ensure response.data is an array
      return Array.isArray(response.data)
        ? response.data
        : response.data && response.data.data
        ? response.data.data
        : [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },

  // Create new produk master
  async createProdukMaster(data, images = []) {
    // Create FormData for multipart/form-data (for images)
    const formData = new FormData();

    // Append all produk data
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // Append images if any
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("produkImages", image);
      });
    }

    const response = await api.post("/produk-master", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Update existing produk master
  async updateProdukMaster(id, data, images = []) {
    // Create FormData for multipart/form-data (for images)
    const formData = new FormData();

    // Append all produk data
    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    // Append images if any
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("produkImages", image);
      });
    }

    const response = await api.put(`/produk-master/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete produk master
  async deleteProdukMaster(id) {
    const response = await api.delete(`/produk-master/${id}`);
    return response.data;
  },

  // Upload images for produk master
  async uploadProdukImages(id, images = []) {
    const formData = new FormData();

    // Append images
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append("produkImages", image);
      });
    }

    const response = await api.post(`/produk-master/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete produk master image
  async deleteProdukImage(produkId, imageId) {
    const response = await api.delete(
      `/produk-master/${produkId}/images/${imageId}`
    );
    return response.data;
  },
};

export default produkMasterService;
