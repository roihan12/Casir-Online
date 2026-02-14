import api from "@common/utils/api";

// API endpoint base
const TAX_ENDPOINT = "/tax";

/**
 * Get tax configuration for a branch
 * @param {string} cabangId - Cabang ID
 * @returns {Promise<Object>} Tax configuration
 */
export const getTaxConfig = async (cabangId) => {
  try {
    const response = await api.get(`${TAX_ENDPOINT}/config/${cabangId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update tax configuration for a branch
 * @param {string} cabangId - Cabang ID
 * @param {Object} data - Tax configuration data
 * @returns {Promise<Object>} Updated tax configuration
 */
export const updateTaxConfig = async (cabangId, data) => {
  try {
    const response = await api.put(`${TAX_ENDPOINT}/config/${cabangId}`, data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate tax for an amount
 * @param {Object} data - Calculation data { amount, cabangId }
 * @returns {Promise<Object>} Calculation result
 */
export const calculateTax = async (data) => {
  try {
    const response = await api.post(`${TAX_ENDPOINT}/calculate`, data);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};



/**
 * Update tax configuration for multiple branches
 * @param {Object} data - Bulk update data { targetCabangIds, config }
 * @returns {Promise<Object>} Update result
 */
export const updateTaxConfigBulk = async (data) => {
  try {
    const response = await api.put(`${TAX_ENDPOINT}/config/bulk`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};


export default {
  getTaxConfig,
  updateTaxConfig,
  calculateTax,
  updateTaxConfigBulk,
};