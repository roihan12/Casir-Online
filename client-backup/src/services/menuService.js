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
    const response = await api.get('/menus');
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
    return response.data.data;
};

// CRUD Methods
export const createMenu = async (data) => {
    const response = await api.post('/menus', data);
    return response.data;
};

export const updateMenu = async (id, data) => {
    const response = await api.put(`/menus/${id}`, data);
    return response.data;
};

export const updateMenuStatus = async (id, isActive) => {
    const response = await api.put(`/menus/${id}/status`, { isActive });
    return response.data;
};

export const deleteMenu = async (id) => {
    const response = await api.delete(`/menus/${id}`);
    return response.data;
};

// Role Assignment Methods
export const assignMenuToRole = async (data) => {
    const response = await api.post('/menus/assign', data);
    return response.data;
};

export const removeMenuFromRole = async (roleMenuId) => {
    const response = await api.delete(`/menus/assign/${roleMenuId}`);
    return response.data;
};

export const bulkAssignMenusToRole = async (roleId, menuIds) => {
    const response = await api.post('/menus/bulk-assign', { roleId, menuIds });
    return response.data;
};

// Default export untuk backward compatibility
export default {
    getSidebarNavigation,
    getUserMenus,
    getAllMenus,
    getRoleMenus,
    getMenuHierarchy,
    createMenu,
    updateMenu,
    updateMenuStatus,
    deleteMenu,
    assignMenuToRole,
    removeMenuFromRole,
    bulkAssignMenusToRole
};