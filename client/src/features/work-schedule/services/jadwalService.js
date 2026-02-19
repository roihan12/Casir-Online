import api from "@common/utils/api";

const JADWAL_URL = "/jadwal";

const jadwalService = {
  /**
   * Get all schedules with optional filters
   * @param {Object} params - Query parameters (userId, cabangId, shiftId, start, end, etc.)
   * @returns {Promise<Object>} - Schedule list
   */
  getJadwal: async (params = {}) => {
    const response = await api.get(JADWAL_URL, { params });
    return response.data;
  },

  /**
   * Get a schedule by ID
   * @param {string} id - The schedule ID
   * @returns {Promise<Object>} - Schedule data
   */
  getJadwalById: async (id) => {
    const response = await api.get(`${JADWAL_URL}/${id}`);
    return response.data;
  },

  /**
   * Create a new schedule
   * @param {Object} data - The schedule data
   * @returns {Promise<Object>} - Created schedule
   */
  createJadwal: async (data) => {
    const response = await api.post(JADWAL_URL, data);
    return response.data;
  },

  /**
   * Generate schedules in bulk
   * @param {Object} data - Bulk generation data
   * @returns {Promise<Object>} - Result of generation
   */
  generateJadwalBulk: async (data) => {
    const response = await api.post(`${JADWAL_URL}/generate`, data);
    return response.data;
  },

   /**
   * Generate schedules for Regu (Rolling)
   * @param {Object} data - Regu generation data
   * @returns {Promise<Object>} - Result of generation
   */
  generateJadwalRegu: async (data) => {
    const response = await api.post(`${JADWAL_URL}/generate-regu`, data);
    return response.data;
  },

  /**
   * Update a schedule
   * @param {string} id - The schedule ID
   * @param {Object} data - The updated schedule data
   * @returns {Promise<Object>} - Updated schedule
   */
  updateJadwal: async (id, data) => {
    const response = await api.put(`${JADWAL_URL}/${id}`, data);
    return response.data;
  },

  /**
   * Delete a schedule
   * @param {string} id - The schedule ID
   * @returns {Promise<Object>} - Success message
   */
  deleteJadwal: async (id) => {
    const response = await api.delete(`${JADWAL_URL}/${id}`);
    return response.data;
  },
};

export default jadwalService;
