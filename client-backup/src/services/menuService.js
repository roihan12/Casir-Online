import api from './api';

/**
 * Menu Service - API untuk permission-based sidebar
 */

/**
 * Get sidebar navigation berdasarkan permission user yang login
 * Endpoint ini sudah filter menu berdasarkan permission user
 */
export const getSidebarNavigation = async () => {
    const response = await api.get('/menu-view/sidebar');
    return response.data;
};

/**
 * Get user menus berdasarkan cabang
 * Alias untuk backward compatibility
 */
export const getUserMenus = async (cabangId) => {
    const response = await api.get('/menu-view/sidebar', {
        params: cabangId ? { cabangId } : {}
    });
    return response.data?.data || [];
};

/**
 * Get all menus (untuk admin)
 */
export const getAllMenus = async () => {
    const response = await api.get('/menu-view/menus');
    return response.data?.data || [];
};

/**
 * Get menus untuk role tertentu
 */
export const getRoleMenus = async (roleId) => {
    const response = await api.get(`/menu-view/role/${roleId}/menus`);
    return response.data?.data || [];
};

/**
 * Get menu hierarchy
 */
export const getMenuHierarchy = async () => {
    const response = await api.get('/menu-view/hierarchy');
    return response.data;
};

// Default export untuk backward compatibility
export default {
    getSidebarNavigation,
    getUserMenus,
    getAllMenus,
    getRoleMenus,
    getMenuHierarchy
};