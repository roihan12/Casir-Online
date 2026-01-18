import api from './index';

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
};

export default authApi;
