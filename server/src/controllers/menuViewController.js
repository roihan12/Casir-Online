const menuService = require('../services/menuService');

/**
 * Controller untuk mengelola akses ke view menu dan role
 * Refactored to use MenuService
 */
class MenuViewController {
  /**
   * Mendapatkan struktur menu dengan hierarki
   */
  async getMenuHierarchy(req, res) {
    try {
      const result = await menuService.getMenuHierarchy();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting menu hierarchy:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan hierarki menu',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan ringkasan role dan menu
   */
  async getRoleMenuSummary(req, res) {
    try {
      const result = await menuService.getRoleMenuSummary();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting role menu summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan ringkasan menu role',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan detail izin akses menu untuk setiap role
   */
  async getRoleMenuPermissions(req, res) {
    try {
      const { roleId } = req.params;
      const result = await menuService.getRoleMenuPermissions(roleId || null);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting role menu permissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan izin akses menu',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan menu yang tersedia untuk role tertentu
   */
  async getAvailableMenuByRole(req, res) {
    try {
      const { roleId } = req.params;
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: 'Role ID diperlukan'
        });
      }
      
      const result = await menuService.getAvailableMenuByRole(roleId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting available menu by role:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan menu yang tersedia',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan menu yang belum diberikan ke role tertentu
   */
  async getUnassignedMenuByRole(req, res) {
    try {
      const { roleId } = req.params;
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: 'Role ID diperlukan'
        });
      }
      
      const result = await menuService.getUnassignedMenuByRole(roleId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting unassigned menu by role:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan menu yang belum diberikan',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan data menu untuk navigasi sidebar berdasarkan permissions user yang login
   * NEW: Uses permission-based approach instead of role_menu
   */
  async getSidebarNavigation(req, res) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }

      const result = await menuService.getSidebarByPermissions(userId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting sidebar navigation:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan navigasi sidebar',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan data menu untuk navigasi sidebar berdasarkan role
   * Uses the new permission-based view
   */
  async getRoleSidebarNavigation(req, res) {
    try {
      const { roleId } = req.params;
      
      if (!roleId) {
        return res.status(400).json({
          success: false,
          message: 'Role ID diperlukan'
        });
      }
      
      const result = await menuService.getRoleSidebarByView(roleId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting role sidebar navigation:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan navigasi sidebar berdasarkan role',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan statistik penggunaan menu
   */
  async getMenuUsageStatistics(req, res) {
    try {
      const result = await menuService.getMenuUsageStatistics();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting menu usage statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan statistik penggunaan menu',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan menu yang paling banyak diberikan izin akses
   */
  async getMostAccessedMenu(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await menuService.getMostAccessedMenu(limit);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting most accessed menu:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan menu yang paling banyak diakses',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan data menu dalam format JSON untuk API
   */
  async getMenuJson(req, res) {
    try {
      const result = await menuService.getMenuJson();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting menu JSON:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan data menu dalam format JSON',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan data menu dan izin akses dalam format JSON untuk API berdasarkan role
   */
  async getRoleMenuJson(req, res) {
    try {
      const { roleId } = req.params;
      const result = await menuService.getRoleMenuJson(roleId || null);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting role menu JSON:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan data menu dan izin akses dalam format JSON',
        error: error.message
      });
    }
  }

  /**
   * Mendapatkan ringkasan sistem menu dan role
   */
  async getMenuRoleSystemSummary(req, res) {
    try {
      const result = await menuService.getMenuRoleSystemSummary();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting menu role system summary:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan ringkasan sistem menu dan role',
        error: error.message
      });
    }
  }

  // ========================================
  // MENU CRUD OPERATIONS
  // ========================================

  /**
   * Get all menus
   */
  async getAllMenus(req, res) {
    try {
      const result = await menuService.getAllMenus();
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting all menus:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan daftar menu',
        error: error.message
      });
    }
  }

  /**
   * Get menu by ID
   */
  async getMenuById(req, res) {
    try {
      const { menuId } = req.params;
      const result = await menuService.getMenuById(menuId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting menu by ID:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal mendapatkan menu',
        error: error.message
      });
    }
  }

  /**
   * Create new menu
   */
  async createMenu(req, res) {
    try {
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.createMenu(req.body, auditInfo);
      return res.status(201).json({
        success: true,
        message: 'Menu berhasil dibuat',
        data: result
      });
    } catch (error) {
      console.error('Error creating menu:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal membuat menu',
        error: error.message
      });
    }
  }

  /**
   * Update menu
   */
  async updateMenu(req, res) {
    try {
      const { menuId } = req.params;
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.updateMenu(menuId, req.body, auditInfo);
      return res.status(200).json({
        success: true,
        message: 'Menu berhasil diupdate',
        data: result
      });
    } catch (error) {
      console.error('Error updating menu:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal mengupdate menu',
        error: error.message
      });
    }
  }

  /**
   * Delete menu
   */
  async deleteMenu(req, res) {
    try {
      const { menuId } = req.params;
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.deleteMenu(menuId, auditInfo);
      return res.status(200).json({
        success: true,
        message: 'Menu berhasil dihapus',
        data: result
      });
    } catch (error) {
      console.error('Error deleting menu:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal menghapus menu',
        error: error.message
      });
    }
  }

  // ========================================
  // ROLE-MENU ASSIGNMENT OPERATIONS
  // ========================================

  /**
   * Assign menu to role
   */
  async assignMenuToRole(req, res) {
    try {
      const { roleId, menuId } = req.body;
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.assignMenuToRole(roleId, menuId, auditInfo);
      return res.status(201).json({
        success: true,
        message: 'Menu berhasil diberikan ke role',
        data: result
      });
    } catch (error) {
      console.error('Error assigning menu to role:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal memberikan menu ke role',
        error: error.message
      });
    }
  }

  /**
   * Remove menu from role
   */
  async removeMenuFromRole(req, res) {
    try {
      const { roleMenuId } = req.params;
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.removeMenuFromRole(roleMenuId, auditInfo);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error removing menu from role:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal menghapus menu dari role',
        error: error.message
      });
    }
  }

  /**
   * Bulk assign menus to role
   */
  async bulkAssignMenusToRole(req, res) {
    try {
      const { roleId, menuIds } = req.body;
      const auditInfo = {
        userId: req.user?.id,
        ipAddress: req.ip
      };
      const result = await menuService.bulkAssignMenusToRole(roleId, menuIds, auditInfo);
      return res.status(201).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      console.error('Error bulk assigning menus to role:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal memberikan menu ke role',
        error: error.message
      });
    }
  }

  /**
   * Get role menus
   */
  async getRoleMenus(req, res) {
    try {
      const { roleId } = req.params;
      const result = await menuService.getRoleMenus(roleId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting role menus:', error);
      const statusCode = error.status || 500;
      return res.status(statusCode).json({
        success: false,
        message: error.message || 'Gagal mendapatkan menu role',
        error: error.message
      });
    }
  }

  /**
   * Get user menus (for authenticated user)
   */
  async getUserMenus(req, res) {
    try {
      const userId = req.user?.id;
      const cabangId = req.user?.cabangId || req.query.cabangId;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User tidak terautentikasi'
        });
      }
      
      const result = await menuService.getUserMenus(userId, cabangId);
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Error getting user menus:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendapatkan menu user',
        error: error.message
      });
    }
  }
}

module.exports = new MenuViewController();