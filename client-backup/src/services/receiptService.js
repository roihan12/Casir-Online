import api from "@/common/utils/api";

/**
 * Get receipt data for a transaction
 * @param {string} transaksiId - Transaction ID
 * @returns {Promise<Object>} Receipt data with promo, credit, and payment info
 */
export const getReceiptData = async (transaksiId) => {
  const response = await api.get(`/receipt/transaction/${transaksiId}`);
  return response.data.data;
};

/**
 * Get receipt preview (HTML format)
 * @param {string} transaksiId - Transaction ID
 * @returns {Promise<string>} HTML content
 */
export const getReceiptPreview = async (transaksiId) => {
  const response = await api.get(`/receipt/preview/${transaksiId}`, {
    responseType: 'text',
  });
  return response.data;
};

/**
 * Get receipt as PDF
 * @param {string} transaksiId - Transaction ID
 * @returns {Promise<Blob>} PDF blob
 */
export const getReceiptPDF = async (transaksiId) => {
  const response = await api.get(`/receipt/preview/${transaksiId}?format=pdf`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Send receipt by email
 * @param {Object} data - Email data
 * @returns {Promise<Object>} Result
 */
export const sendReceiptByEmail = async (data) => {
  const response = await api.post("/receipt/email", data);
  return response.data;
};

export default {
  getReceiptData,
  getReceiptPreview,
  getReceiptPDF,
  sendReceiptByEmail,
};
