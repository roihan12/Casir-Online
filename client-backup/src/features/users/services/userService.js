import api from "@services/api";

const userService = {
  // Get all users with optional filters
  async getUserList(filters = {}) {
    try {
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.search) params.append("search", filters.search);
      if (filters.roleId) params.append("roleId", filters.roleId);
      if (filters.cabangId) params.append("cabangId", filters.cabangId);
      if (filters.status) params.append("status", filters.status);
      if (filters.page) params.append("page", filters.page);
      if (filters.limit) params.append("limit", filters.limit);

      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async getUserDashboard() {
    try {
      const response = await api.get("/user-dashboard");
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Create new user - handles FormData for file uploads
  async createUser(userData) {
    try {
      let response;

      // Check if userData is FormData (contains file upload)
      if (userData instanceof FormData) {
        response = await api.post("/users", userData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Regular JSON data
        response = await api.post("/users", userData);
      }

      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Update user - handles FormData for file uploads
  async updateUser(id, userData) {
    try {
      let response;

      // Check if userData is FormData (contains file upload)
      if (userData instanceof FormData) {
        response = await api.put(`/users/${id}`, userData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        // Regular JSON data
        response = await api.put(`/users/${id}`, userData);
      }

      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Delete user
  async deleteUser(id) {
    try {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Reset user password
  async resetPassword(id) {
    try {
      const response = await api.post(`/users/${id}/reset-password`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Update user status
  async updateUserStatus(id, status) {
    try {
      const response = await api.put(`/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Force logout user
  async forceLogout(id) {
    try {
      const response = await api.post(`/users/${id}/force-logout`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Get user activity logs
  async getActivityLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`/users/activity-logs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Dashboard Stats
  async getUserStats() {
    try {
      const response = await api.get("/user-dashboard/stats");
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async getRoleDistribution() {
    try {
      const response = await api.get("/user-dashboard/role-distribution");
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async getUsersPerCabang() {
    try {
      const response = await api.get("/user-dashboard/users-per-cabang");
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Invalidate user cache
  async invalidateCache(id = "") {
    try {
      const response = await api.get(
        `/users/invalidate-cache${id ? `/${id}` : ""}`
      );
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Helper method to handle errors
  _handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const errorMessage = error.response.data.message || "An error occurred";
      throw new Error(errorMessage);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(error.message);
    }
  },
};

export default userService;

