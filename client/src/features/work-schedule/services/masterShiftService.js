import api from "@common/utils/api";

const MASTER_SHIFT_URL = "/master-shifts";

const masterShiftService = {
  /**
   * Get all master shifts
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Master shift list
   */
  getAllMasterShifts: async (params = {}) => {
    const response = await api.get(MASTER_SHIFT_URL, { params });
    return response.data;
  },

  /**
   * Get a master shift by ID
   * @param {string} id - The master shift ID
   * @returns {Promise<Object>} - Master shift data
   */
  getMasterShiftById: async (id) => {
    const response = await api.get(`${MASTER_SHIFT_URL}/${id}`);
    return response.data;
  },
};

export default masterShiftService;
