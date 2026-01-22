// permissionService.js - Service for managing permissions

import api from "./api";

const permissionService = {
  // Get all permissions
  async getAllPermissions() {
    try {
      const response = await api.get("/permissions");
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Get permission by ID
  async getPermissionById(id) {
    try {
      const response = await api.get(`/permissions/${id}`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Create new permission
  async createPermission(permissionData) {
    try {
      const response = await api.post("/permissions", permissionData);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Update permission
  async updatePermission(id, permissionData) {
    try {
      const response = await api.put(`/permissions/${id}`, permissionData);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Delete permission
  async deletePermission(id) {
    try {
      const response = await api.delete(`/permissions/${id}`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Get permissions by module
  async getPermissionsByModule(module) {
    try {
      const response = await api.get(`/permissions/module/${module}`);
      return response.data.data;
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

export default permissionService;
