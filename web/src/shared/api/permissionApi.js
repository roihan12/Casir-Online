import api from './index';

/**
 * Permission API Service
 */
export const permissionApi = {
  // Get all permissions
  getAll: async () => {
    const response = await api.get('/permissions');
    return response.data;
  },

  // Get permissions by role
  getByRole: async (roleId) => {
    const response = await api.get(`/permissions/role/${roleId}`);
    return response.data;
  },

  // Assign permission to role
  assign: async (roleId, permissionId) => {
    const response = await api.post('/permissions/assign', { roleId, permissionId });
    return response.data;
  },

  // Bulk assign permissions to role
  bulkAssign: async (roleId, permissionIds) => {
    const response = await api.post('/permissions/bulk-assign', { roleId, permissionIds });
    return response.data;
  },

  // Remove permission from role
  remove: async (rolePermissionId) => {
    const response = await api.delete(`/permissions/role-permission/${rolePermissionId}`);
    return response.data;
  },
};

export default permissionApi;
