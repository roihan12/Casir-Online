import api from "@common/utils/api";
import { GLOBAL_CABANG_ID } from "../context/CabangContext";

// API endpoint base
const CABANG_ENDPOINT = "/cabang";

/**
 * Get list of all branches (cabang)
 * @returns {Promise<Array>} List of cabang
 */
export const getCabangList = async (page = 1, itemsPerPage = 10) => {
  try {
    const response = await api.get(
      `${CABANG_ENDPOINT}?page=${page}&limit=${itemsPerPage}`
    );
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single cabang by ID
 * @param {string} id - Cabang ID
 * @returns {Promise<Object>} Cabang details
 */
export const getCabangById = async (id) => {
  // Global view tidak memerlukan API call
  if (id === GLOBAL_CABANG_ID) {
    return {
      id: GLOBAL_CABANG_ID,
      namaCabang: "Semua Cabang",
      alamat: "Lihat data dari semua cabang",
      status: "aktif",
      isGlobalView: true,
    };
  }

  try {
    const response = await api.get(`${CABANG_ENDPOINT}/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get cabang statistics
 * @param {string} id - Cabang ID (null or GLOBAL_CABANG_ID for global stats)
 * @returns {Promise<Object>} Cabang statistics
 */
export const getCabangStats = async (id = null) => {
  try {
    let endpoint = `/dashboard?cabangId=all`;
    if (id && id !== GLOBAL_CABANG_ID) {
      endpoint = `/dashboard?cabangId=${id}`;
    }

    const response = await api.get(endpoint);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new cabang
 * @param {Object} cabangData - Cabang data
 * @returns {Promise<Object>} Created cabang
 */
export const createCabang = async (cabangData) => {
  try {
    const response = await api.post(CABANG_ENDPOINT, cabangData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing cabang
 * @param {string} id - Cabang ID
 * @param {Object} cabangData - Updated cabang data
 * @returns {Promise<Object>} Updated cabang
 */
export const updateCabang = async (id, cabangData) => {
  try {
    const response = await api.put(`${CABANG_ENDPOINT}/${id}`, cabangData);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a cabang
 * @param {string} id - Cabang ID
 * @returns {Promise<Object>} Response
 */
export const deleteCabang = async (id) => {
  try {
    const response = await api.delete(`${CABANG_ENDPOINT}/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update cabang status
 * @param {string} id - Cabang ID
 * @param {string} status - New status ('aktif' or 'nonaktif')
 * @returns {Promise<Object>} Updated cabang
 */
export const updateCabangStatus = async (id, status) => {
  try {
    const response = await api.patch(`${CABANG_ENDPOINT}/${id}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all users assigned to a cabang
 * @param {string} id - Cabang ID
 * @returns {Promise<Array>} List of users in the cabang
 */
export const getCabangUsers = async (id) => {
  try {
    if (id === GLOBAL_CABANG_ID) {
      // Untuk global view, ambil semua user dari semua cabang
      return api.get(`/users`);
    }

    const response = await api.get(`${CABANG_ENDPOINT}/${id}/users`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get map overview data for all branches
 * @returns {Promise<Object>} Map overview with branch statistics
 */
export const getMapOverview = async () => {
  try {
    const response = await api.get(`${CABANG_ENDPOINT}/map-overview`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eksport default dengan semua method
export default {
  getCabangList,
  getCabangById,
  getCabangStats,
  createCabang,
  updateCabang,
  deleteCabang,
  updateCabangStatus,
  getCabangUsers,
  getMapOverview,
};
