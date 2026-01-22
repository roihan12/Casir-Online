import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';

// Layouts
import RoleBasedLayout from '../features/layouts/RoleBasedLayout';

// Auth Pages
import LoginPage from '../features/auth/pages/LoginPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';

// Error Pages
import NotFoundPage from '../features/common/pages/NotFoundPage';

// Common Pages
import ProfilePage from '../features/user/pages/ProfilePage';
import SettingsPage from '../features/user/pages/SettingsPage';
import SearchResults from '../features/common/pages/SearchResults';
import DefaultDashboard from '../features/common/pages/DefaultDashboard';
import DynamicDashboard from '../features/common/components/DynamicDashboard';
import UniversalDashboard from '../features/common/pages/UniversalDashboard';
import FeatureExamplePage from '../features/common/pages/FeatureExamplePage';

// Route Protection Components
import ProtectedRoute from './ProtectedRoute';
import DynamicRoute from './DynamicRoute';
import RoleBasedRoute from './RoleBasedRoute';
import WithoutAuth from './WithoutAuth';

// Feature Routes
import { superAdminRoutes } from '../features/superadmin/routes';
import { adminCabangRoutes } from '../features/admincabang/routes';
import { kasirRoutes } from '../features/kasir/routes';
import { gudangRoutes } from '../features/gudang/routes';
import { manajerRoutes } from '../features/manajer/routes';
import menuRoutes from './menuRoutes';

// Dashboard Components
import SuperAdminDashboard from '../features/superadmin/pages/dashboard/SuperAdminDashboard';
import AdminCabangDashboard from '../features/admincabang/pages/dashboard/AdminCabangDashboard';
import GudangDashboard from '../features/gudang/pages/dashboard/GudangDashboard';
import ManajerDashboard from '../features/manajer/pages/dashboard/ManajerDashboard';
import KasirDashboard from '../features/kasir/pages/dashboard/KasirDashboard';

// POS Components
import GlobalPOS from '../features/superadmin/pages/transactions/GlobalPOS';
import BranchPOS from '../features/admincabang/pages/transactions/BranchPOS';
import PointOfSale from '../features/kasir/pages/pos/PointOfSale';

const router = createBrowserRouter([
  // Public Routes
  {
    path: '/login',
    element: <WithoutAuth><LoginPage /></WithoutAuth>,
  },
  {
    path: '/forgot-password',
    element: <WithoutAuth><ForgotPasswordPage /></WithoutAuth>,
  },
  
  // Default redirect
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  
  // All routes accessible to authenticated users based on their roles
  {
    path: '/',
    element: <ProtectedRoute allowedRoles={['super_admin', 'admin_cabang', 'kasir', 'gudang', 'manajer']}>
      <RoleBasedLayout />
    </ProtectedRoute>,
    children: [
      // Common routes
      { path: 'profile', element: <ProfilePage /> },
      { 
        path: 'settings', 
        children: [
          { index: true, element: <Navigate to="account" replace /> },
          { path: 'account', element: <SettingsPage /> },
        ]
      },
      { path: 'search', element: <SearchResults /> },
      {
        path: 'features',
        element: <ProtectedRoute allowedRoles={[]}>
          <FeatureExamplePage />
        </ProtectedRoute>
      },
      
      // Dashboard routes with role protection
      { 
        path: 'dashboard', 
        element: <ProtectedRoute requiredPermission="dashboard.read">
          <Outlet />
        </ProtectedRoute>,
        children: [
          {
            index: true,
            element: <ProtectedRoute allowedRoles={[]}>
              <UniversalDashboard />
            </ProtectedRoute>
          }
        ]
      },
      
      { 
        path: 'pos', 
        element: <RoleBasedRoute 
          roleConfig={{
            'super_admin': { component: GlobalPOS, allowedRoles: ['super_admin'] },
            'admin_cabang': { component: BranchPOS, allowedRoles: ['admin_cabang'] },
            'kasir': { component: PointOfSale, allowedRoles: ['kasir'] }
          }}
          fallbackComponent={DefaultDashboard}
          fallbackPath="/dashboard"
          strict={false}
        />
      },
      
      // Feature-specific routes from all roles
      ...superAdminRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute allowedRoles={['super_admin']} requiredPermission={route.requiredPermission}>{route.element}</ProtectedRoute>
      })),
      
      ...adminCabangRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute allowedRoles={['admin_cabang']} requiredPermission={route.requiredPermission}>{route.element}</ProtectedRoute>
      })),
      
      // Feature-specific routes from kasir
      ...kasirRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute allowedRoles={['kasir']} requiredPermission={route.requiredPermission || 'transaksi.read'}>{route.element}</ProtectedRoute>
      })),
      
      // Feature-specific routes from gudang
      ...gudangRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute allowedRoles={['gudang']} requiredPermission={route.requiredPermission || 'inventory.read'}>{route.element}</ProtectedRoute>
      })),
      
      // Feature-specific routes from manajer
      ...manajerRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute allowedRoles={['manajer']} requiredPermission={route.requiredPermission}>{route.element}</ProtectedRoute>
      })),
      
      // Menu management routes
      ...menuRoutes.map(route => ({
        ...route,
        element: <ProtectedRoute requiredPermission={route.requiredPermission || 'settings.read'}>{route.element}</ProtectedRoute>
      })),
      
      // Legacy routes for backward compatibility
      { 
        path: 'superadmin/*', 
        element: <Navigate to="/" replace /> 
      },
      { 
        path: 'admin/*', 
        element: <Navigate to="/" replace /> 
      },
      { 
        path: 'kasir/*', 
        element: <Navigate to="/" replace /> 
      },
      { 
        path: 'gudang/*', 
        element: <Navigate to="/" replace /> 
      },
      { 
        path: 'manajer/*', 
        element: <Navigate to="/" replace /> 
      },
    ]
  },
  
  // Kasir Routes
  {
    path: '/kasir',
    element: <ProtectedRoute allowedRoles={['kasir']}><RoleBasedLayout /></ProtectedRoute>,
    children: [
      // Default route
      { index: true, element: <Navigate to="pos" replace /> },
      
      // Feature-specific routes
      ...kasirRoutes,
    ],
  },
  
  // Gudang Routes
  {
    path: '/gudang',
    element: <ProtectedRoute allowedRoles={['gudang']}><RoleBasedLayout /></ProtectedRoute>,
    children: [
      // Default route
      { index: true, element: <Navigate to="dashboard" replace /> },
      
      // Feature-specific routes
      ...gudangRoutes,
    ],
  },
  
  // Manajer Routes
  {
    path: '/manajer',
    element: <ProtectedRoute allowedRoles={['manajer']}><RoleBasedLayout /></ProtectedRoute>,
    children: [
      // Default route
      { index: true, element: <Navigate to="dashboard" replace /> },
      
      // Feature-specific routes
      ...manajerRoutes,
    ],
  },
  
  // 404 Not Found
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;