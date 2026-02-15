import api from '../../../services/api';

/**
 * Clock in with face verification and location
 * @param {Object} data - Clock in data
 * @param {string} data.lokasiAbsensiId - Attendance location ID
 * @param {number} data.latitude - GPS latitude
 * @param {number} data.longitude - GPS longitude
 * @param {string} data.photo - Base64 encoded photo
 * @returns {Promise<Object>} Clock in result
 */
export const clockIn = async (data) => {
  try {
    const response = await api.post('/attendance/clock-in', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Clock in failed');
  }
};

/**
 * Clock out with face verification and location
 * @param {Object} data - Clock out data
 * @param {string} data.lokasiAbsensiId - Attendance location ID
 * @param {number} data.latitude - GPS latitude
 * @param {number} data.longitude - GPS longitude
 * @param {string} data.photo - Base64 encoded photo
 * @returns {Promise<Object>} Clock out result
 */
export const clockOut = async (data) => {
  try {
    const response = await api.post('/attendance/clock-out', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Clock out failed');
  }
};

/**
 * Check liveness of a photo
 * @param {string} photo - Base64 encoded photo
 * @returns {Promise<Object>} Liveness check result
 */
export const checkLiveness = async (photo) => {
  try {
    const response = await api.post('/attendance/liveness', { photo });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Liveness check failed');
  }
};

/**
 * Register user face
 * @param {string} userId - User ID
 * @param {string} photo - Base64 encoded photo
 * @returns {Promise<Object>} Face registration result
 */
export const registerFace = async (userId, photo) => {
  try {
    const response = await api.post(`/attendance/register-face/${userId}`, { photo });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Face registration failed');
  }
};

/**
 * Get today's attendance for current user
 * @returns {Promise<Object>} Today's attendance record
 */
export const getTodayAttendance = async () => {
  try {
    const response = await api.get('/attendance/today');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get today\'s attendance');
  }
};

/**
 * Get attendance history
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID (optional, admin only)
 * @param {string} params.startDate - Start date (ISO format)
 * @param {string} params.endDate - End date (ISO format)
 * @param {string} params.status - Attendance status filter
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Paginated attendance history
 */
export const getAttendanceHistory = async (params = {}) => {
  try {
    const response = await api.get('/attendance/history', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get attendance history');
  }
};

/**
 * Get attendance statistics
 * @param {Object} params - Query parameters
 * @param {string} params.startDate - Start date (ISO format)
 * @param {string} params.endDate - End date (ISO format)
 * @returns {Promise<Object>} Attendance statistics
 */
export const getAttendanceStatistics = async (params = {}) => {
  try {
    const response = await api.get('/attendance/statistics', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get attendance statistics');
  }
};

/**
 * Verify attendance location
 * @param {Object} data - Location verification data
 * @param {string} data.lokasiAbsensiId - Location ID
 * @param {number} data.latitude - GPS latitude
 * @param {number} data.longitude - GPS longitude
 * @returns {Promise<Object>} Location verification result
 */
export const verifyLocation = async (data) => {
  try {
    const response = await api.post('/attendance/verify-location', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Location verification failed');
  }
};

/**
 * Get all attendance locations
 * @param {Object} params - Query parameters
 * @param {string} params.cabangId - Branch ID
 * @param {string} params.status - Location status filter
 * @param {string} params.search - Search term
 * @returns {Promise<Array>} List of attendance locations
 */
export const getAttendanceLocations = async (params = {}) => {
  try {
    const response = await api.get('/attendance-locations', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get attendance locations');
  }
};

/**
 * Get user's accessible locations
 * @returns {Promise<Array>} List of accessible locations for current user
 */
export const getMyLocations = async () => {
  try {
    const response = await api.get('/attendance-locations/my-locations');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get user locations');
  }
};

/**
 * Get location by ID
 * @param {string} locationId - Location ID
 * @returns {Promise<Object>} Location details
 */
export const getLocationById = async (locationId) => {
  try {
    const response = await api.get(`/attendance-locations/${locationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get location');
  }
};

/**
 * Create new attendance location (admin)
 * @param {Object} data - Location data
 * @returns {Promise<Object>} Created location
 */
export const createLocation = async (data) => {
  try {
    const response = await api.post('/attendance-locations', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create location');
  }
};

/**
 * Update attendance location (admin)
 * @param {string} locationId - Location ID
 * @param {Object} data - Updated location data
 * @returns {Promise<Object>} Updated location
 */
export const updateLocation = async (locationId, data) => {
  try {
    const response = await api.put(`/attendance-locations/${locationId}`, data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update location');
  }
};

/**
 * Delete attendance location (admin)
 * @param {string} locationId - Location ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteLocation = async (locationId) => {
  try {
    const response = await api.delete(`/attendance-locations/${locationId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete location');
  }
};

/**
 * Assign user to location (admin)
 * @param {Object} data - Assignment data
 * @param {string} data.userId - User ID
 * @param {string} data.lokasiAbsensiId - Location ID
 * @returns {Promise<Object>} Assignment result
 */
export const assignUserToLocation = async (data) => {
  try {
    const response = await api.post('/attendance-locations/assign', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to assign user to location');
  }
};

/**
 * Unassign user from location (admin)
 * @param {Object} data - Unassignment data
 * @param {string} data.userId - User ID
 * @param {string} data.lokasiAbsensiId - Location ID
 * @returns {Promise<Object>} Unassignment result
 */
export const unassignUserFromLocation = async (data) => {
  try {
    const response = await api.post('/attendance-locations/unassign', data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to unassign user from location');
  }
};

/**
 * Get users assigned to a location
 * @param {string} locationId - Location ID
 * @returns {Promise<Array>} List of assigned users
 */
export const getLocationUsers = async (locationId) => {
  try {
    const response = await api.get(`/attendance-locations/${locationId}/users`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get location users');
  }
};
