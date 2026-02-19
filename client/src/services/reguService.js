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
  /**
   * Create a new regu
   * @param {Object} data - Regu data
   * @returns {Promise<Object>} - Created regu
   */
  createRegu: async (data) => {
    const response = await api.post(REGU_URL, data);
    return response.data;
  },

  /**
   * Update a regu
   * @param {string} id - Regu ID
   * @param {Object} data - Updated regu data
   * @returns {Promise<Object>} - Updated regu
   */
  updateRegu: async (id, data) => {
    const response = await api.put(`${REGU_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a regu
   * @param {string} id - Regu ID
   * @returns {Promise<Object>} - Success message
   */
  deleteRegu: async (id) => {
    const response = await api.delete(`${REGU_URL}/${id}`);
    return response.data;
  },

  /**
   * Add members to a regu
   * @param {string} reguId - Regu ID
   * @param {Array<string>} userIds - List of user IDs
   * @returns {Promise<Object>} - Success message
   */
  addMembers: async (reguId, userIds) => {
    const response = await api.post(`${REGU_URL}/${reguId}/members`, { userIds });
    return response.data;
  },

  /**
   * Remove members from a regu
   * @param {string} reguId - Regu ID
   * @param {Array<string>} userIds - List of user IDs
   * @returns {Promise<Object>} - Success message
   */
  removeMembers: async (reguId, userIds) => {
    const response = await api.delete(`${REGU_URL}/${reguId}/members`, { data: { userIds } });
    return response.data;
  },

  /**
   * Move members to another regu
   * @param {Object} data - { userIds, fromReguId, toReguId }
   * @returns {Promise<Object>} - Success message
   */
  moveMembers: async (data) => {
    const response = await api.post(`${REGU_URL}/members/move`, data);
    return response.data;
  },
};

export default reguService;
