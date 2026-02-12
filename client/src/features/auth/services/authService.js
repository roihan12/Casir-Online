import api from '../../../services/api';

// Interceptors are now handled in api.js

// Login user
export const login = async (username, password) => {
    try {
      // Panggil API login
      const response = await api.post("/auth/login", { username, password });

      // Kembalikan data user
      return response.data;
    } catch (error) {
      // Improve error handling by checking for different error structures
      if (error.response && error.response.data) {
        throw new Error(error.response.data.message || "Login failed");
      }
      throw new Error(error.message || "Login failed - Network error");
    }
  }




// Register user
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

// Logout user
export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Logout failed');
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

// Refresh token
export const refreshToken = async () => {
  try {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }
    
    const response = await api.post('/auth/refresh-token', {
      refreshToken: refreshTokenValue
    });
    
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to refresh token');
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send reset password email');
  }
};

// Reset password
export const resetPassword = async ({ token, password, confirmPassword }) => {
  try {
    const response = await api.post('/auth/reset-password', {
      token,
      password,
      confirmPassword
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to reset password');
  }
};

// Change password
export const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
  try {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to change password');
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put('/auth/profile', profileData);
    return response.data.data.user;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

// Update user profile with avatar
export const updateProfileWithAvatar = async (formData) => {
  try {
    const response = await api.put('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.user;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

// Check authentication status
export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/profile');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Authentication check failed');
  }
};