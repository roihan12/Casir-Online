import api from "./api";

// Delivery & Driver Service — authenticated endpoints
const deliveryClientService = {
  // === Driver CRUD ===
  getDrivers: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.cabangId) query.append("cabangId", params.cabangId);
    const response = await api.get(`/drivers?${query.toString()}`);
    return response.data;
  },

  getAvailableDrivers: async (cabangId) => {
    const response = await api.get(
      `/drivers/available?cabangId=${cabangId || ""}`
    );
    return response.data;
  },

  createDriver: async (data) => {
    const response = await api.post("/drivers", data);
    return response.data;
  },

  updateDriver: async (id, data) => {
    const response = await api.patch(`/drivers/${id}`, data);
    return response.data;
  },

  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },

  toggleDriverStatus: async (id) => {
    const response = await api.patch(`/drivers/${id}/toggle-status`);
    return response.data;
  },

  // === Delivery Management ===
  getDeliveryOrders: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append("status", params.status);
    if (params.page) query.append("page", params.page);
    if (params.limit) query.append("limit", params.limit);
    if (params.cabangId) query.append("cabangId", params.cabangId);
    const response = await api.get(`/delivery/orders?${query.toString()}`);
    return response.data;
  },

  assignDriver: async (transaksiId, driverId) => {
    const response = await api.patch(`/delivery/orders/${transaksiId}/assign`, {
      driver_id: driverId,
    });
    return response.data;
  },

  updateDeliveryStatus: async (transaksiId, data) => {
    const response = await api.patch(
      `/delivery/orders/${transaksiId}/delivery-status`,
      data
    );
    return response.data;
  },

  markPaymentReceived: async (transaksiId, data) => {
    const response = await api.patch(
      `/delivery/orders/${transaksiId}/payment-received`,
      data
    );
    return response.data;
  },

  markDeliveryFailed: async (transaksiId, alasan) => {
    const response = await api.patch(
      `/delivery/orders/${transaksiId}/failed`,
      { alasan }
    );
    return response.data;
  },

  getDriverActiveDeliveries: async (driverId) => {
    const response = await api.get(`/delivery/driver/${driverId}/active`);
    return response.data;
  },

  addDeliveryLocation: async (transaksiId, data) => {
    const response = await api.post(`/delivery/orders/${transaksiId}/location`, data);
    return response.data;
  }
};

export default deliveryClientService;
