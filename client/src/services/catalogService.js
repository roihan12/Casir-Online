import axios from "axios";

const API_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "/api";

/**
 * Public API instance — no auth interceptor
 * Used for e-catalog public endpoints
 */
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Catalog Service — public endpoints
const catalogService = {
  // Get products for a branch catalog
  getProducts: async (cabangId, params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.kategoriId) query.append("kategoriId", params.kategoriId);
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.minPrice) query.append("minPrice", params.minPrice);
    if (params.maxPrice) query.append("maxPrice", params.maxPrice);

    const response = await publicApi.get(
      `/catalog/${cabangId}/products?${query.toString()}`
    );
    return response.data;
  },

  // Get categories for a branch
  getCategories: async (cabangId) => {
    const response = await publicApi.get(`/catalog/${cabangId}/categories`);
    return response.data;
  },

  // Get branch info
  getCabangInfo: async (cabangId) => {
    const response = await publicApi.get(`/catalog/${cabangId}/info`);
    return response.data;
  },

  // Get product detail
  getProductDetail: async (cabangId, produkId) => {
    const response = await publicApi.get(`/catalog/${cabangId}/product/${produkId}`);
    return response.data;
  },

  // Verify promo code
  verifyPromo: async (cabangId, data) => {
    const response = await publicApi.post(
      `/catalog/${cabangId}/verify-promo`,
      data
    );
    return response.data;
  },

  // Get eligible promos
  getEligiblePromos: async (cabangId, data) => {
    const response = await publicApi.post(
      `/catalog/${cabangId}/eligible-promos`,
      data
    );
    return response.data;
  },
};

export default catalogService;
