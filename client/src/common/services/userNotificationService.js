import api from "../utils/api"; // assuming standard axios instance is named api.js

const USER_NOTIFICATION_URL = "/user-notifications";

const userNotificationService = {
  // Get all notifications for user
  getNotifications: async (params = {}) => {
    const response = await api.get(USER_NOTIFICATION_URL, { params });
    return response.data;
  },

  // Mark specific notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`${USER_NOTIFICATION_URL}/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put(`${USER_NOTIFICATION_URL}/read-all`);
    return response.data;
  }
};

export default userNotificationService;
