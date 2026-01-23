import api from "@common/utils/api";

/**
 * Service for handling inventory notification API calls
 */
const inventoryNotificationService = {
  /**
   * Get all inventory notifications with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {string} params.cabangId - Branch ID or 'all' for all branches
   * @param {string} params.type - Notification type filter
   * @param {string} params.status - Notification status filter
   * @param {string} params.priority - Notification priority filter
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise<Object>} Notifications with pagination
   */
  getNotifications: async (params = {}) => {
    try {
      // Create a new params object without cabangId if it's 'all' or empty
      const queryParams = { ...params };
      if (!queryParams.cabangId || queryParams.cabangId === 'all') {
        delete queryParams.cabangId;
      }
      
      const response = await api.get("/notifications", { params: queryParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get notification statistics
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {Promise<Object>} Notification statistics
   */
  getNotificationStats: async (cabangId = null) => {
    try {
      // Only include cabangId if it's provided and not 'all'
      const params = {};
      if (cabangId && cabangId !== 'all') {
        params.cabangId = cabangId;
      }
      
      const response = await api.get("/notifications/stats", { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.post(`/notifications/read`, { notificationId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Mark all notifications as read
   * @param {string} cabangId - Branch ID or 'all' for all branches
   * @returns {Promise<Object>} Result of operation
   */
  markAllAsRead: async (cabangId = null) => {
    try {
      const params = cabangId ? { cabangId } : {};
      const response = await api.put("/notifications/read-all", params);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<Object>} Result of operation
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get notification details
   * @param {string} notificationId - ID of the notification
   * @returns {Promise<Object>} Notification details
   */
  getNotificationDetails: async (notificationId) => {
    try {
      const response = await api.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: error.message };
    }
  }
};

export default inventoryNotificationService;