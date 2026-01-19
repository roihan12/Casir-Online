import api from './index';

/**
 * Kasir API Service
 * Endpoints for POS/cashier operations
 */
const kasirApi = {
  // ==================== SHIFT (using dedicated shift routes) ====================
  
  /**
   * Get active shift for current user
   */
  getActiveShift: (cabangId) => 
    api.get('/shift/active', { params: { cabangId } }),

  /**
   * Open a new shift
   * @param {Object} data - { cabangId, kasAwal }
   */
  openShift: (data) => 
    api.post('/shift/open', data),

  /**
   * Close active shift
   * @param {Object} data - { cabangId, kasAkhir, notes }
   */
  closeShift: (data) => 
    api.post('/shift/close', data),

  /**
   * Adjust shift (correction)
   * @param {Object} data - adjustment data
   */
  adjustShift: (data) =>
    api.post('/shift/adjust', data),

  /**
   * Get shifts history
   */
  getShiftsHistory: (params) => 
    api.get('/shift', { params }),

  // ==================== PRODUCTS (using dedicated produk routes) ====================
  
  /**
   * Search products for POS
   * @param {string} query - Search term
   * @param {string} cabangId - Branch ID
   */
  searchProducts: (query, cabangId) => 
    api.get(`/produk/${cabangId}/search`, { 
      params: { q: query } 
    }),

  /**
   * Get product by barcode
   * @param {string} barcode - Barcode
   */
  getProductByBarcode: (barcode) => 
    api.get(`/produk/barcode/${barcode}`),

  /**
   * Get frequently used products (popular products for initial display)
   * @param {string} cabangId - Branch ID
   */
  getPopularProducts: (cabangId) => 
    api.get(`/produk?cabangId=${cabangId}`),

  /**
   * Get all products for branch
   * @param {string} cabangId - Branch ID
   */
  getAllProducts: (cabangId, params = {}) => 
    api.get('/produk', { params: { cabangId, ...params } }),

  // ==================== CUSTOMERS ====================
  
  /**
   * Search customers
   * @param {string} query - Search term
   * @param {string} cabangId - Branch ID
   */
  searchCustomers: (query, cabangId) => 
    api.get('/kasir/customers/search', { 
      params: { query, cabangId } 
    }),

  // ==================== TRANSACTIONS (using dedicated transaksi routes) ====================
  
  /**
   * Create new transaction
   * @param {Object} data - Transaction data
   */
  createTransaction: (data) => 
    api.post('/transaksi', data),

  /**
   * Get transaction by ID
   */
  getTransaction: (id) => 
    api.get(`/transaksi/${id}`),

  /**
   * Get transactions list
   */
  getTransactions: (params) => 
    api.get('/transaksi', { params }),

  /**
   * Cancel transaction
   */
  cancelTransaction: (id) =>
    api.put(`/transaksi/${id}/cancel`),

  /**
   * Create QRIS payment
   */
  createQrisPayment: (data) =>
    api.post('/transaksi/payment/qris', data),

  /**
   * Add payment to transaction
   */
  addPayment: (data) =>
    api.post('/transaksi/payment', data),

  // ==================== RECEIPTS ====================
  
  /**
   * Print receipt
   */
  printReceipt: (transactionId) => 
    api.post(`/kasir/receipts/print/${transactionId}`),

  /**
   * Get receipt configuration
   */
  getReceiptConfig: () => 
    api.get('/kasir/receipts/config'),

  // ==================== REPORTS ====================
  
  /**
   * Get daily summary
   */
  getDailySummary: (cabangId, date) => 
    api.get('/kasir/reports/daily', { 
      params: { cabangId, date } 
    }),

  // ==================== DASHBOARD ====================
  
  /**
   * Get kasir dashboard
   */
  getDashboard: (cabangId) => 
    api.get('/kasir/dashboard', { params: { cabangId } }),
};

export default kasirApi;
