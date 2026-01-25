// userRoleCabangService.js - Service for managing user-role and user-cabang mappings
import api from "@services/api";

const userRoleCabangService = {
  // User Role assignments
  async assignRoleToUser(userId, roleId) {
    try {
      const response = await api.post("/user-role-cabang/roles", { userId, roleId });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async removeRoleFromUser(userRoleId) {
    try {
      const response = await api.delete(`/user-role-cabang/roles/${userRoleId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async getUserRoles(userId) {
    try {
      const response = await api.get(`/user-role-cabang/roles/${userId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  // User Cabang assignments
  async assignUserToCabang(userId, cabangId) {
    try {
      const response = await api.post("/user-role-cabang/cabang", { userId, cabangId });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async removeUserFromCabang(userCabangId) {
    try {
      const response = await api.delete(`/user-role-cabang/cabang/${userCabangId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async setPrimaryCabang(userCabangId) {
    try {
      const response = await api.put(`/user-role-cabang/cabang/${userCabangId}/primary`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  async getUserCabang(userId) {
    try {
      const response = await api.get(`/user-role-cabang/cabang/${userId}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  },

  _handleError(error) {
    const errorMessage = error.response?.data?.message || error.message || "An error occurred";
    throw new Error(errorMessage);
  }
};

export default userRoleCabangService;
