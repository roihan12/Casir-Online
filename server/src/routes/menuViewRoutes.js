const express = require('express');
const router = express.Router();
const menuViewController = require('../controllers/menuViewController');
const { authenticate } = require('../middleware/authMiddleware');
const { hasPermission } = require('../middleware/permissionMiddleware');

/**
 * Routes untuk akses ke view menu dan role
 */

// Route untuk mendapatkan struktur menu dengan hierarki
router.get('/hierarchy', authenticate, hasPermission(['menu:read']), menuViewController.getMenuHierarchy);

// Route untuk mendapatkan ringkasan role dan menu
router.get('/role-summary', authenticate, hasPermission(['menu:read']), menuViewController.getRoleMenuSummary);

// Route untuk mendapatkan detail izin akses menu untuk semua role
router.get('/permissions', authenticate, hasPermission(['menu:read']), menuViewController.getRoleMenuPermissions);

// Route untuk mendapatkan detail izin akses menu untuk role tertentu
router.get('/permissions/:roleId', authenticate, hasPermission(['menu:read']), menuViewController.getRoleMenuPermissions);

// Route untuk mendapatkan menu yang tersedia untuk role tertentu
router.get('/available/:roleId', authenticate, hasPermission(['menu:read']), menuViewController.getAvailableMenuByRole);

// Route untuk mendapatkan menu yang belum diberikan ke role tertentu
router.get('/unassigned/:roleId', authenticate, hasPermission(['menu:read']), menuViewController.getUnassignedMenuByRole);

// Route untuk mendapatkan data menu untuk navigasi sidebar
router.get('/sidebar', authenticate, menuViewController.getSidebarNavigation);

// Route untuk mendapatkan data menu untuk navigasi sidebar berdasarkan role
router.get('/sidebar/:roleId', authenticate, hasPermission(['menu:read']), menuViewController.getRoleSidebarNavigation);

// Route untuk mendapatkan statistik penggunaan menu
router.get('/statistics', authenticate, hasPermission(['menu:manage']), menuViewController.getMenuUsageStatistics);

// Route untuk mendapatkan menu yang paling banyak diberikan izin akses
router.get('/most-accessed', authenticate, hasPermission(['menu:manage']), menuViewController.getMostAccessedMenu);

// Route untuk mendapatkan data menu dalam format JSON untuk API
router.get('/json', authenticate, hasPermission(['menu:read']), menuViewController.getMenuJson);

// Route untuk mendapatkan data menu dan izin akses dalam format JSON untuk API berdasarkan role
router.get('/json/:roleId', authenticate, hasPermission(['menu:read']), menuViewController.getRoleMenuJson);

// Route untuk mendapatkan ringkasan sistem menu dan role
router.get('/system-summary', authenticate, hasPermission(['menu:manage']), menuViewController.getMenuRoleSystemSummary);

module.exports = router;