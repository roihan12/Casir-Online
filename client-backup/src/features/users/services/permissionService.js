import api from "@services/api";

const permissionService = {
  // Get all permissions
  getAll: async () => {
    try {
      const response = await api.get('/permissions');
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Get permissions by role
  getByRole: async (roleId) => {
    try {
      const response = await api.get(`/permissions/role/${roleId}`);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Get permission by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/permissions/${id}`);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Create new permission
  create: async (permissionData) => {
    try {
      const response = await api.post('/permissions', permissionData);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Update permission
  update: async (id, permissionData) => {
    try {
      const response = await api.put(`/permissions/${id}`, permissionData);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Delete permission
  delete: async (id) => {
    try {
      const response = await api.delete(`/permissions/${id}`);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Assign permission to role
  assign: async (roleId, permissionId) => {
    try {
      const response = await api.post('/permissions/assign', { roleId, permissionId });
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Bulk assign permissions to role
  bulkAssign: async (roleId, permissionIds) => {
    try {
      const response = await api.post('/permissions/bulk-assign', { roleId, permissionIds });
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Remove permission from role
  remove: async (rolePermissionId) => {
    try {
      const response = await api.delete(`/permissions/role-permission/${rolePermissionId}`);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Get permissions by module
  getByModule: async (module) => {
    try {
      const response = await api.get(`/permissions/module/${module}`);
      return response.data;
    } catch (error) {
      permissionService._handleError(error);
    }
  },

  // Helper method to handle errors
  _handleError(error) {
    if (error.response) {
      const errorMessage = error.response.data.message || "An error occurred";
      throw new Error(errorMessage);
    } else if (error.request) {
      throw new Error("No response from server. Please check your connection.");
    } else {
      throw new Error(error.message);
    }
  },
};

export default permissionService;
