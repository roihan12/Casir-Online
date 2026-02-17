import api from "./api";

const REGU_URL = "/regu";

const reguService = {
  /**
   * Get all regu with optional filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Regu list
   */
  getAllRegu: async (params = {}) => {
    const response = await api.get(REGU_URL, { params });
    return response.data;
  },

  /**
   * Get a regu by ID
   * @param {string} id - The regu ID
   * @returns {Promise<Object>} - Regu data
   */
  getReguById: async (id) => {
    const response = await api.get(`${REGU_URL}/${id}`);
    return response.data;
  },
};

export default reguService;
