import api from './index';

/**
 * Menu API Service
 */
export const menuApi = {
  // Get sidebar navigation for current user
  getSidebar: async () => {
    const response = await api.get('/menu-view/sidebar');
    return response.data;
  },

  // Get menu hierarchy
  getHierarchy: async () => {
    const response = await api.get('/menu-view/hierarchy');
    return response.data;
  },
};

export default menuApi;
