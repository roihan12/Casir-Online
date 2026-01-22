import api from "./api";

// Simple product service with all necessary methods
const productService = {
  // Get products with optional filters
  getProducts: async (filters = {}) => {
    try {
      // Mock implementation until real API is ready
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Return mock data
      return {
        data: [
          {
            id: "101",
            produkMaster: {
              namaProduk: "Produk A",
              sku: "SKU-A001",
            },
            hargaBeli: 15000,
            hargaJual: 25000,
            stok: 100,
          },
          {
            id: "102",
            produkMaster: {
              namaProduk: "Produk B",
              sku: "SKU-B002",
            },
            hargaBeli: 22000,
            hargaJual: 35000,
            stok: 75,
          },
          {
            id: "103",
            produkMaster: {
              namaProduk: "Produk C",
              sku: "SKU-C003",
            },
            hargaBeli: 30000,
            hargaJual: 45000,
            stok: 50,
          },
        ],
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Get product details by ID
  getProductById: async (id) => {
    try {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Return mock data
      return {
        data: {
          id,
          produkMaster: {
            namaProduk: `Produk ${id}`,
            sku: `SKU-${id}`,
          },
          hargaBeli: 15000,
          hargaJual: 25000,
          stok: 100,
          deskripsi: `Deskripsi produk ${id}`,
        },
      };
    } catch (error) {
      console.error("Error fetching product details:", error);
      throw error;
    }
  },

  // Create a new product
  createProduct: async (productData) => {
    try {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Return mock created product
      return {
        data: {
          id: "new-id",
          ...productData,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  // Update a product
  updateProduct: async (id, productData) => {
    try {
      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Return mock updated product
      return {
        data: {
          id,
          ...productData,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },
};

export default productService;
