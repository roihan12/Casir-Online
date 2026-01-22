import React from 'react';
import MenuManagementPage from '../pages/admin/MenuManagementPage';

/**
 * Routes untuk menu management
 */
const menuRoutes = [
  {
    path: '/admin/menu-management',
    element: <MenuManagementPage />,
    requiredPermission: 'settings.read' // Added permission requirement
  }
];

export default menuRoutes;