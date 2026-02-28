import axios from "axios";

const API_URL =
  import.meta.env?.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "/api";

const publicApi = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Checkout Service — public endpoints
const checkoutClientService = {
  // Create online order
  createOrder: async (data) => {
    const response = await publicApi.post("/checkout", data);
    return response.data;
  },

  // Get order status
  getOrderStatus: async (transaksiId, cabangId) => {
    const response = await publicApi.get(
      `/checkout/${transaksiId}/status?cabangId=${cabangId}`
    );
    return response.data;
  },

  // Cancel order
  cancelOrder: async (transaksiId, alasan, cabangId) => {
    const response = await publicApi.post(
      `/checkout/${transaksiId}/cancel?cabangId=${cabangId}`,
      { alasan }
    );
    return response.data;
  },

  // Get delivery tracking
  getDeliveryTracking: async (transaksiId) => {
    const response = await publicApi.get(
      `/delivery/orders/${transaksiId}/tracking`
    );
    return response.data;
  },
};

export default checkoutClientService;
