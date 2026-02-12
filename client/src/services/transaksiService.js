import api from "./api";

const transaksiService = {
  // Create a new transaction (purchase, sale, return)
  createTransaksi: async (data) => {
    return api.post("/transaksi", data);
  },

  // Get transaction by ID
  getTransaksiById: async (id) => {
    return api.get(`/transaksi/${id}`);
  },

  // Get list of transactions with filters
  getTransaksiList: async (filters = {}) => {
    return api.get("/transaksi", { params: filters });
  },

  // Add payment to a transaction
  addPayment: async (data) => {
    return api.post("/transaksi/payment", data);
  },

  // Cancel a transaction
  cancelTransaksi: async (id, alasanBatal) => {
    return api.post(`/transaksi/${id}/cancel`, { alasan_batal: alasanBatal });
  },

  // Get supplier purchase history
  getSupplierPurchaseHistory: async (supplierId, filters = {}) => {
    return api.get(`/supplier/${supplierId}/purchases`, { params: filters });
  },

  // Create QRIS payment
  createQrisPayment: async (data) => {
    return api.post("/transaksi/payment/qris", data);
  },

  // Check QRIS payment status
  checkQrisPaymentStatus: async (paymentId) => {
    return api.get(`/transaksi/payment/qris/${paymentId}/status`);
  },

  // Get transaction receipt
  getTransaksiReceipt: async (id) => {
    return api.get(`/transaksi/${id}/receipt`);
  },

  // Email receipt to customer
  emailReceipt: async (id, email) => {
    return api.post(`/transaksi/${id}/receipt/email`, { email });
  },
};

export default transaksiService;
