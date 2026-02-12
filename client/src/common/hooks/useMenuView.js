import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { API_URL } from '../config';

/**
 * Custom hooks untuk mengakses API menu view
 */

/**
 * Hook untuk mendapatkan struktur menu dengan hierarki
 * @returns {Object} Query object dari react-query
 */
export const useMenuHierarchy = () => {
  return useQuery({
    queryKey: ['menuHierarchy'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/hierarchy`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan ringkasan role dan menu
 * @returns {Object} Query object dari react-query
 */
export const useRoleMenuSummary = () => {
  return useQuery({
    queryKey: ['roleMenuSummary'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/role-summary`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan detail izin akses menu untuk role tertentu
 * @param {string} roleId - ID role
 * @returns {Object} Query object dari react-query
 */
export const useRoleMenuPermissions = (roleId) => {
  return useQuery({
    queryKey: ['roleMenuPermissions', roleId],
    queryFn: async () => {
      const url = roleId 
        ? `${API_URL}/api/menu-view/permissions/${roleId}` 
        : `${API_URL}/api/menu-view/permissions`;
      const response = await axios.get(url);
      return response.data.data;
    },
    enabled: !!roleId, // Hanya jalankan query jika roleId ada
  });
};

/**
 * Hook untuk mendapatkan menu yang tersedia untuk role tertentu
 * @param {string} roleId - ID role
 * @returns {Object} Query object dari react-query
 */
export const useAvailableMenuByRole = (roleId) => {
  return useQuery({
    queryKey: ['availableMenu', roleId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/available/${roleId}`);
      return response.data.data;
    },
    enabled: !!roleId, // Hanya jalankan query jika roleId ada
  });
};

/**
 * Hook untuk mendapatkan menu yang belum diberikan ke role tertentu
 * @param {string} roleId - ID role
 * @returns {Object} Query object dari react-query
 */
export const useUnassignedMenuByRole = (roleId) => {
  return useQuery({
    queryKey: ['unassignedMenu', roleId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/unassigned/${roleId}`);
      return response.data.data;
    },
    enabled: !!roleId, // Hanya jalankan query jika roleId ada
  });
};

/**
 * Hook untuk mendapatkan data menu untuk navigasi sidebar
 * @returns {Object} Query object dari react-query
 */
export const useSidebarNavigation = () => {
  return useQuery({
    queryKey: ['sidebarNavigation'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/sidebar`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan data menu untuk navigasi sidebar berdasarkan role
 * @param {string} roleId - ID role
 * @returns {Object} Query object dari react-query
 */
export const useRoleSidebarNavigation = (roleId) => {
  return useQuery({
    queryKey: ['roleSidebarNavigation', roleId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/sidebar/${roleId}`);
      return response.data.data;
    },
    enabled: !!roleId, // Hanya jalankan query jika roleId ada
  });
};

/**
 * Hook untuk mendapatkan statistik penggunaan menu
 * @returns {Object} Query object dari react-query
 */
export const useMenuUsageStatistics = () => {
  return useQuery({
    queryKey: ['menuUsageStatistics'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/statistics`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan menu yang paling banyak diberikan izin akses
 * @returns {Object} Query object dari react-query
 */
export const useMostAccessedMenu = () => {
  return useQuery({
    queryKey: ['mostAccessedMenu'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/most-accessed`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan data menu dalam format JSON untuk API
 * @returns {Object} Query object dari react-query
 */
export const useMenuJson = () => {
  return useQuery({
    queryKey: ['menuJson'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/json`);
      return response.data.data;
    },
  });
};

/**
 * Hook untuk mendapatkan data menu dan izin akses dalam format JSON untuk API berdasarkan role
 * @param {string} roleId - ID role
 * @returns {Object} Query object dari react-query
 */
export const useRoleMenuJson = (roleId) => {
  return useQuery({
    queryKey: ['roleMenuJson', roleId],
    queryFn: async () => {
      const url = roleId 
        ? `${API_URL}/api/menu-view/json/${roleId}` 
        : `${API_URL}/api/menu-view/json`;
      const response = await axios.get(url);
      return response.data.data;
    },
    enabled: !!roleId, // Hanya jalankan query jika roleId ada
  });
};

/**
 * Hook untuk mendapatkan ringkasan sistem menu dan role
 * @returns {Object} Query object dari react-query
 */
export const useMenuRoleSystemSummary = () => {
  return useQuery({
    queryKey: ['menuRoleSystemSummary'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/menu-view/system-summary`);
      return response.data.data;
    },
  });
};