const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Controller untuk mengelola akses ke view menu dan role
 */
class MenuViewController {
  /**
   * Mendapatkan struktur menu dengan hierarki
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMenuHierarchy(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_menu_hierarchy ORDER BY level, order_index, menu_name`;
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getRoleMenuSummary(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_role_menu_summary ORDER BY nama_role`;
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getRoleMenuPermissions(req, res) {
    try {
      const { roleId } = req.params;
      
      let query = `SELECT * FROM vw_role_menu_permissions`;
      const params = [];
      
      if (roleId) {
        query += ` WHERE role_id = $1`;
        params.push(roleId);
      }
      
      query += ` ORDER BY role_display_name, parent_menu, menu_name`;
      
      const result = await prisma.$queryRawUnsafe(query, ...params);
      
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
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
      
      const result = await prisma.$queryRaw`
        SELECT * FROM vw_available_menu_by_role 
        WHERE role_id = ${roleId} 
        ORDER BY order_index, menu_name
      `;
      
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
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
      
      const result = await prisma.$queryRaw`
        SELECT * FROM vw_unassigned_menu_by_role 
        WHERE role_id = ${roleId} 
        ORDER BY order_index, menu_name
      `;
      
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
   * Mendapatkan data menu untuk navigasi sidebar
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getSidebarNavigation(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_sidebar_navigation ORDER BY parent_order, parent_name, child_order, child_name`;
      
      // Transform data untuk format yang lebih mudah digunakan di frontend
      const transformedData = [];
      const parentMenuMap = new Map();
      
      for (const item of result) {
        if (!parentMenuMap.has(item.parent_id)) {
          const parentMenu = {
            id: item.parent_id,
            name: item.parent_name,
            path: item.parent_path,
            icon: item.parent_icon,
            order: item.parent_order,
            children: []
          };
          
          transformedData.push(parentMenu);
          parentMenuMap.set(item.parent_id, parentMenu);
        }
        
        if (item.child_id) {
          const parentMenu = parentMenuMap.get(item.parent_id);
          parentMenu.children.push({
            id: item.child_id,
            name: item.child_name,
            path: item.child_path,
            icon: item.child_icon,
            order: item.child_order,
            active: item.child_active
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        data: transformedData
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
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
      
      const result = await prisma.$queryRaw`
        SELECT * FROM vw_role_sidebar_navigation 
        WHERE role_id = ${roleId} AND has_view_permission = true 
        ORDER BY parent_order, parent_name, child_order, child_name
      `;
      
      // Transform data untuk format yang lebih mudah digunakan di frontend
      const transformedData = [];
      const parentMenuMap = new Map();
      
      for (const item of result) {
        if (!parentMenuMap.has(item.parent_id)) {
          const parentMenu = {
            id: item.parent_id,
            name: item.parent_name,
            path: item.parent_path,
            icon: item.parent_icon,
            order: item.parent_order,
            children: []
          };
          
          transformedData.push(parentMenu);
          parentMenuMap.set(item.parent_id, parentMenu);
        }
        
        if (item.child_id && item.has_view_permission) {
          const parentMenu = parentMenuMap.get(item.parent_id);
          parentMenu.children.push({
            id: item.child_id,
            name: item.child_name,
            path: item.child_path,
            icon: item.child_icon,
            order: item.child_order
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        data: transformedData
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMenuUsageStatistics(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_menu_usage_statistics ORDER BY assigned_roles_count DESC, menu_name`;
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMostAccessedMenu(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_most_accessed_menu ORDER BY role_count DESC, menu_name LIMIT 10`;
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMenuJson(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_menu_json WHERE is_active = true ORDER BY order_index, menu_name`;
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getRoleMenuJson(req, res) {
    try {
      const { roleId } = req.params;
      
      let query = `SELECT * FROM vw_role_menu_json`;
      const params = [];
      
      if (roleId) {
        query += ` WHERE role_id = $1`;
        params.push(roleId);
      }
      
      query += ` ORDER BY nama_role`;
      
      const result = await prisma.$queryRawUnsafe(query, ...params);
      
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
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getMenuRoleSystemSummary(req, res) {
    try {
      const result = await prisma.$queryRaw`SELECT * FROM vw_menu_role_system_summary`;
      return res.status(200).json({
        success: true,
        data: result[0] // Hanya ada satu baris dalam view ini
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
}

module.exports = new MenuViewController();