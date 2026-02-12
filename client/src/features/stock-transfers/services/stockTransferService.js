import api from "@common/utils/api";

/**
 * Get stock transfers with pagination and filtering
 */
const getStockTransfers = async (params = {}) => {
  try {
    const response = await api.get("/stock-transfers", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get stock transfer by ID
 */
const getStockTransferById = async (id) => {
  try {
    const response = await api.get(`/stock-transfers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Create a new stock transfer
 */
const createStockTransfer = async (data) => {
  try {
    const response = await api.post("/stock-transfers", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Update a stock transfer (draft only)
 */
const updateStockTransfer = async (id, data) => {
  try {
    const response = await api.put(`/stock-transfers/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Submit a stock transfer for approval
 */
const submitForApproval = async (id, data = {}) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/submit`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Approve a stock transfer
 */
const approveStockTransfer = async (id, data = {}) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/approve`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Reject a stock transfer
 */
const rejectStockTransfer = async (id, data) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/reject`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Send a stock transfer
 */
const sendStockTransfer = async (id, data) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/send`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Receive a stock transfer
 */
const receiveStockTransfer = async (id, data) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/receive`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Cancel a stock transfer
 */
const cancelStockTransfer = async (id, data) => {
  try {
    const response = await api.put(`/stock-transfers/${id}/cancel`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get pending transfers for a branch
 */
const getPendingTransfersForBranch = async (cabangId, params = {}) => {
  try {
    const response = await api.get(`/stock-transfers?cabangId=${cabangId}&status=pending`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get transfers that need approval (for super_admin)
 */
const getTransfersNeedingApproval = async (params = {}) => {
  try {
    const response = await api.get("/stock-transfers/approval", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get pending transfers with filters for approval list
 */
const getPendingTransfers = async (params = {}) => {
  try {
    const response = await api.get(`/stock-transfers/pending/${params.cabangId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get transfer history for a branch
 */
const getTransferHistoryForBranch = async (cabangId, params = {}) => {
  try {
    const response = await api.get(`/stock-transfers/history/${cabangId}`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get products available for transfer from a specific branch
 */
const getProductsForBranch = async (cabangId) => {
  try {
    const response = await api.get(`/produk?cabangId=${cabangId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

/**
 * Get stock transfer statistics
 */
const getTransferStats = async (cabangId = null) => {
  try {
    const params = cabangId ? { cabangId } : {};
    const response = await api.get("/stock-transfers/stats", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

const stockTransferService = {
  getStockTransfers,
  getStockTransferById,
  createStockTransfer,
  updateStockTransfer,
  submitForApproval,
  approveStockTransfer,
  rejectStockTransfer,
  sendStockTransfer,
  receiveStockTransfer,
  cancelStockTransfer,
  getPendingTransfersForBranch,
  getTransfersNeedingApproval,
  getPendingTransfers,
  getTransferHistoryForBranch,
  getProductsForBranch,
  getTransferStats,
};

export default stockTransferService;
