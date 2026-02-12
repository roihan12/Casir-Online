import api from './api';

/**
 * Auth API Service
 * Handles login, logout, and profile endpoints
 */
export const authApi = {
  /**
   * Login with username and password
   * Backend sets httpOnly cookies (auth_token, session_id)
   */
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },

  /**
   * Logout - clears session and cookies
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  /**
   * Get current user profile
   * Uses cookies for authentication
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /**
   * Update user profile with avatar
   */
  updateProfileWithAvatar: async (formData) => {
    const response = await api.put('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default authApi;
