import api from "./api";

/**
 * Service for managing product-supplier relationships
 */
const produkSupplierService = {
  /**
   * Create a new product-supplier relationship
   * @param {Object} data - The relationship data
   * @returns {Promise<Object>} API response
   */
  createProdukSupplier: async (data) => {
    try {
      // Ensure data is properly formatted for the backend
      const requestData = {
        produkMasterId: data.produkMasterId,
        supplierId: data.supplierId,
        hargaBeli: data.hargaBeli,

        // Include optional fields
        leadTime: data.leadTime || null,
        minPembelian: data.minPembelian || null,
        kodeProdukSupplier: data.kodeProdukSupplier || null,

        // Make sure status is one of the valid values: 'aktif' or 'tidak_aktif'
        status: data.status === "tidak_aktif" ? "tidak_aktif" : "aktif",
        isPrimary: !!data.isPrimary, // Convert to boolean
      };

      // Only include cabangId if it's provided and not "global"
      if (data.cabangId && data.cabangId !== "global") {
        requestData.cabangId = data.cabangId;
      }

      console.log("Sending create request with data:", requestData);

      // Validate that cabangId is being passed correctly
      if (!requestData.cabangId) {
        console.warn(
          "No cabangId provided - this may be ok for global suppliers"
        );
      } else if (requestData.cabangId === "global") {
        console.warn("Using 'global' as cabangId - this might not be valid");
      }

      const response = await api.post("/produk-supplier", requestData);
      console.log("Create response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error in createProdukSupplier:", error);

      // More detailed error logging
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
      }

      throw error;
    }
  },

  /**
   * Update an existing product-supplier relationship
   * @param {string} id - The relationship ID
   * @param {Object} data - The updated data
   * @returns {Promise<Object>} API response
   */
  updateProdukSupplier: async (id, data) => {
    try {
      // Ensure update data is properly formatted
      const updateData = {
        ...data,
        leadTime: data.leadTime || null,
        minPembelian: data.minPembelian || null,
        kodeProdukSupplier: data.kodeProdukSupplier || null,
        isPrimary: !!data.isPrimary, // Convert to boolean
      };

      console.log(`Updating product-supplier ${id} with data:`, updateData);
      const response = await api.put(`/produk-supplier/${id}`, updateData);
      console.log("Update response:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating product-supplier ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a product-supplier relationship
   * @param {string} id - The relationship ID
   * @returns {Promise<Object>} API response
   */
  deleteProdukSupplier: async (id) => {
    const response = await api.delete(`/produk-supplier/${id}`);
    return response.data;
  },

  /**
   * Get all suppliers for a product
   * @param {string} produkMasterId - The product master ID
   * @param {string} cabangId - Optional branch ID to filter suppliers
   * @returns {Promise<Object>} API response
   */
  getSuppliersByProduct: async (produkMasterId, cabangId = null) => {
    const response = await api.get(
      `/produk-supplier/product/${produkMasterId}/suppliers`,
      {
        params: { cabangId },
      }
    );
    return response.data;
  },

  /**
   * Get all products for a supplier with pagination
   * @param {string} supplierId - The supplier ID
   * @param {Object} params - Query parameters (page, limit, search, cabangId, produkMasterId)
   * @returns {Promise<Object>} API response
   */
  getProductsBySupplier: async (supplierId, params = {}) => {
    try {
      // Create a clean copy of params
      const queryParams = { ...params };

      // Remove cabangId if it's "global" to avoid sending it
      if (queryParams.cabangId === "global") {
        delete queryParams.cabangId;
      }

      console.log(
        "Fetching products for supplier:",
        supplierId,
        "with params:",
        queryParams
      );

      const response = await api.get(
        `/produk-supplier/supplier/${supplierId}/products`,
        {
          params: queryParams,
        }
      );

      console.log("API Response for supplier products:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching supplier products:", error);
      throw error;
    }
  },

  /**
   * Get all branches with access to a supplier's products
   * @param {string} supplierId - The supplier ID
   * @returns {Promise<Object>} API response
   */
  getBranchesWithSupplierAccess: async (supplierId) => {
    try {
      console.log(`Fetching branches with access for supplier: ${supplierId}`);

      const response = await api.get(
        `/produk-supplier/supplier/${supplierId}/branches`
      );

      console.log("Branches with access response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching branches with supplier access:", error);
      throw error;
    }
  },

  /**
   * Get available products that can be added to a supplier
   * @param {string} supplierId - The supplier ID
   * @param {Object} params - Query parameters (page, limit, search, cabangId)
   * @returns {Promise<Object>} API response with available products
   */
  getAvailableProductsForSupplier: async (supplierId, params = {}) => {
    try {
      // Create a clean copy of params
      const queryParams = { ...params };

      // Remove cabangId if it's "global" to avoid sending it
      if (queryParams.cabangId === "global") {
        delete queryParams.cabangId;
      }

      console.log("Fetching available products for supplier:", supplierId);
      console.log("Query params:", queryParams);

      const response = await api.get(
        `/produk-supplier/supplier/${supplierId}/products/available`,
        {
          params: queryParams,
        }
      );

      console.log("Available products API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching available products for supplier:", error);
      throw error;
    }
  },
};

export default produkSupplierService;
