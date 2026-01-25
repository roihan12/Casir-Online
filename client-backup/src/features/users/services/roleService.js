// roleService.js - Service untuk mengelola operasi terkait roles dan permissions

import api from "@services/api";

const roleService = {
  // Get all roles
  async getAllRoles() {
    try {
      const response = await api.get("/roles");
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Alias for backward compatibility
  async getRoleList() {
    return this.getAllRoles();
  },

  // Get role by ID
  async getRoleById(id) {
    try {
      const response = await api.get(`/roles/${id}`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Create new role
  async createRole(roleData) {
    try {
      const response = await api.post("/roles", roleData);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Update role
  async updateRole(id, roleData) {
    try {
      const response = await api.put(`/roles/${id}`, roleData);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Delete role
  async deleteRole(id) {
    try {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // Update role permissions
  async updateRolePermissions(id, data) {
    try {
      const response = await api.put(`/roles/${id}/permissions`, data);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },
  
  // Get role permissions
  async getRolePermissions(id) {
    try {
      const response = await api.get(`/permissions/role/${id}`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },
  
  // Get users by role
  async getUsersByRole(id) {
    try {
      const response = await api.get(`/roles/${id}/users`);
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },
  
  // Assign users to role
  async assignUsersToRole(id, userIds) {
    try {
      const response = await api.post(`/roles/${id}/users`, { userIds });
      return response.data.data;
    } catch (error) {
      this._handleError(error);
    }
  },
  
  // Remove user from role
  async removeUserFromRole(id, userId) {
    try {
      const response = await api.delete(`/roles/${id}/users/${userId}`);
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

export default roleService;
