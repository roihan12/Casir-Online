const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { CreateMenuValidation, UpdateMenuValidation } = require("../validation/menuValidation");
const { createAuditLog } = require("../utils/auditLog");
const {
  cacheGet,
  cacheSet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");

class MenuService {
  /**
   * Create a new menu
   */
  async createMenu(menuData, auditInfo) {
    const validData = validate(CreateMenuValidation, menuData);

    // Check if menu with the same path already exists
    const existingMenu = await prisma.menu.findFirst({
      where: {
        path: validData.path,
      },
    });

    if (existingMenu) {
      throw new ResponseError(400, `Menu with path ${validData.path} already exists`);
    }

    const newMenu = await prisma.menu.create({
      data: validData,
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName, 
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "CREATE",
      tableName: "Menu",
      recordId: newMenu.id,
      oldValues: null,
      newValues: newMenu, // Util handles stringify
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return newMenu;
  }

  /**
   * Update an existing menu
   */
  async updateMenu(menuId, menuData, auditInfo) {
    const validData = validate(UpdateMenuValidation, menuData);

    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!existingMenu) {
      throw new ResponseError(404, "Menu not found");
    }

    // If path is being updated, check for duplicates
    if (validData.path && validData.path !== existingMenu.path) {
      const duplicateMenu = await prisma.menu.findFirst({
        where: {
          path: validData.path,
          id: { not: menuId },
        },
      });

      if (duplicateMenu) {
        throw new ResponseError(400, `Menu with path ${validData.path} already exists`);
      }
    }

    const oldValues = { ...existingMenu };

    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: validData,
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName,
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "UPDATE",
      tableName: "Menu",
      recordId: menuId,
      oldValues: oldValues,
      newValues: updatedMenu,
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return updatedMenu;
  }

  /**
   * Update menu active status
   */
  async updateMenuStatus(menuId, isActive, auditInfo) {
    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!existingMenu) {
      throw new ResponseError(404, "Menu not found");
    }

    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: { isActive: Boolean(isActive) },
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName,
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "UPDATE_STATUS",
      tableName: "Menu",
      recordId: menuId,
      oldValues: { isActive: existingMenu.isActive },
      newValues: { isActive: updatedMenu.isActive },
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return updatedMenu;
  }

  /**
   * Delete a menu
   */
  async deleteMenu(menuId, auditInfo) {
    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!existingMenu) {
      throw new ResponseError(404, "Menu not found");
    }

    // Check if menu is assigned to any roles
    const roleMenus = await prisma.roleMenu.findMany({
      where: { menuId },
    });

    if (roleMenus.length > 0) {
      throw new ResponseError(400, "Cannot delete menu that is assigned to roles");
    }

    const deletedMenu = await prisma.menu.delete({
      where: { id: menuId },
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName,
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "DELETE",
      tableName: "Menu",
      recordId: menuId,
      oldValues: existingMenu,
      newValues: null,
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return deletedMenu;
  }

  /**
   * Get all menus
   */
  async getAllMenus() {
    return prisma.menu.findMany({
      orderBy: [
        { parentId: 'asc' },
        { orderIndex: 'asc' }
      ],
    });
  }

  /**
   * Get menu by ID
   */
  async getMenuById(menuId) {
    const menu = await prisma.menu.findUnique({
      where: { 
        id: menuId,
       },
    });

    if (!menu) {
      throw new ResponseError(404, "Menu not found");
    }

    return menu;
  }

  /**
   * Get menus for a specific role
   */
  async getRoleMenus(roleId) {
    const roleWithMenus = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        roleMenus: {
          include: {
            menu: true,
          },
        },
      },
    });

    if (!roleWithMenus) {
      throw new ResponseError(404, "Role not found");
    }

    return roleWithMenus.roleMenus.map(rm => rm.menu);
  }

  /**
   * Get menus for a user based on their roles
   */
  async getUserMenus(userId, cabangId) {
    const cacheKey = createCacheKey("menus", userId, cabangId);

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Get user roles for the specified cabang
        const userRoles = await prisma.userRole.findMany({
          where: {
            userId: userId,
            cabangId: cabangId,
          },
          include: {
            role: {
              include: {
                roleMenus: {
                  include: {
                    menu: true,
                  },
                },
              },
            },
          },
        });

        // Extract unique menus from all roles
        const menuMap = new Map();
        userRoles.forEach(userRole => {
          userRole.role.roleMenus.forEach(roleMenu => {
            if (!menuMap.has(roleMenu.menu.id)) {
              menuMap.set(roleMenu.menu.id, roleMenu.menu);
            }
          });
        });

        // Convert to array and sort by parent and display order
        const menus = Array.from(menuMap.values());
        return this.buildMenuTree(menus);
      },
      300 // Cache for 5 minutes
    );
  }

  /**
   * Build a hierarchical menu tree from flat menu list
   */
  buildMenuTree(menus) {
    const menuMap = {};
    const rootMenus = [];

    // First pass: create a map of all menus by ID
    menus.forEach(menu => {
      menuMap[menu.id] = {
        ...menu,
        children: [],
      };
    });

    // Second pass: build the tree structure
    menus.forEach(menu => {
      if (menu.parentId) {
        // This is a child menu, add it to its parent's children array
        if (menuMap[menu.parentId]) {
          menuMap[menu.parentId].children.push(menuMap[menu.id]);
        }
      } else {
        // This is a root menu
        rootMenus.push(menuMap[menu.id]);
      }
    });

    // Sort root menus by display order
    rootMenus.sort((a, b) => a.displayOrder - b.displayOrder);

    // Sort children of each menu by display order
    const sortChildren = (menu) => {
      if (menu.children && menu.children.length > 0) {
        menu.children.sort((a, b) => a.displayOrder - b.displayOrder);
        menu.children.forEach(sortChildren);
      }
    };

    rootMenus.forEach(sortChildren);

    return rootMenus;
  }

  /**
   * Assign a menu to a role
   */
  async assignMenuToRole(roleId, menuId, auditInfo) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ResponseError(404, "Role not found");
    }

    // Check if menu exists
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      throw new ResponseError(404, "Menu not found");
    }

    // Check if the role already has this menu
    const existingRoleMenu = await prisma.roleMenu.findUnique({
      where: {
        roleId_menuId: {
          roleId,
          menuId,
        },
      },
    });

    if (existingRoleMenu) {
      throw new ResponseError(400, "Menu is already assigned to this role");
    }

    // Assign menu to role
    const roleMenu = await prisma.roleMenu.create({
      data: {
        roleId,
        menuId,
      },
      include: {
        menu: true,
        role: true,
      },
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName,
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "CREATE",
      tableName: "RoleMenu",
      recordId: roleMenu.id,
      oldValues: null,
      newValues: {
        roleId,
        menuId,
        roleName: role.namaRole,
        menuName: menu.name,
      },
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return roleMenu;
  }

  /**
   * Remove a menu from a role
   */
  async removeMenuFromRole(roleMenuId, auditInfo) {
    // Check if role menu exists
    const roleMenu = await prisma.roleMenu.findUnique({
      where: { id: roleMenuId },
      include: {
        menu: true,
        role: true,
      },
    });

    if (!roleMenu) {
      throw new ResponseError(404, "Role menu not found");
    }

    // Store data for audit log
    const roleMenuData = {
      id: roleMenu.id,
      roleId: roleMenu.roleId,
      menuId: roleMenu.menuId,
      roleName: roleMenu.role.namaRole,
      menuName: roleMenu.menu.name,
    };

    // Remove menu from role
    await prisma.roleMenu.delete({
      where: { id: roleMenuId },
    });

    // Create audit log
    await createAuditLog(prisma, {
      userId: auditInfo.userId,
      userName: auditInfo.userName,
      ipAddress: auditInfo.ipAddress,
      cabangId: auditInfo.cabangId,
      action: "DELETE",
      tableName: "RoleMenu",
      recordId: roleMenuId,
      oldValues: roleMenuData,
      newValues: null,
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return { message: "Menu removed from role successfully" };
  }

  /**
   * Bulk assign menus to a role
   */
  async bulkAssignMenusToRole(roleId, menuIds, auditInfo) {
    // Check if role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new ResponseError(404, "Role not found");
    }

    // Check if all menus exist
    const menus = await prisma.menu.findMany({
      where: {
        id: { in: menuIds },
      },
    });

    if (menus.length !== menuIds.length) {
      throw new ResponseError(400, "One or more menus not found");
    }

    // Get existing role menus to avoid duplicates
    const existingRoleMenus = await prisma.roleMenu.findMany({
      where: {
        roleId,
        menuId: { in: menuIds },
      },
    });

    const existingMenuIds = existingRoleMenus.map(rm => rm.menuId);
    const newMenuIds = menuIds.filter(id => !existingMenuIds.includes(id));

    // Create new role menus in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      const createdRoleMenus = [];

      for (const menuId of newMenuIds) {
        const roleMenu = await prisma.roleMenu.create({
          data: {
            roleId,
            menuId,
          },
          include: {
            menu: true,
          },
        });

        createdRoleMenus.push(roleMenu);

        // Create audit log for each assignment
        await createAuditLog(prisma, {
          userId: auditInfo.userId,
          userName: auditInfo.userName,
          ipAddress: auditInfo.ipAddress,
          cabangId: auditInfo.cabangId,
          action: "CREATE",
          tableName: "RoleMenu",
          recordId: roleMenu.id,
          oldValues: null,
          newValues: {
            roleId,
            menuId,
            roleName: role.namaRole,
            menuName: roleMenu.menu.name,
          },
        });
      }

      return {
        created: createdRoleMenus,
        existing: existingRoleMenus.length,
        total: menuIds.length,
      };
    });

    // Clear menu cache
    await cacheDeletePattern("menus:*");

    return {
      message: "Menus assigned to role successfully",
      created: result.created.length,
      existing: result.existing,
      total: result.total,
    };
  }

  // ========================================
  // PERMISSION-BASED SIDEBAR METHODS (NEW)
  // ========================================

  /**
   * Get sidebar navigation based on user's permissions (NEW - uses permissions instead of role_menu)
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Hierarchical menu structure
   */
  async getSidebarByPermissions(userId) {
    const cacheKey = createCacheKey("sidebar_permissions", userId);

    return await cacheOrFetch(
      cacheKey,
      async () => {
        // Get user's roles with their permissions
        const userRoles = await prisma.userRole.findMany({
          where: { userId },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        });

        if (userRoles.length === 0) {
          return [];
        }

        // Extract unique permission names (format: "module.action")
        const permissionSet = new Set();
        userRoles.forEach(ur => {
          ur.role.permissions.forEach(rp => {
            permissionSet.add(`${rp.permission.module}.${rp.permission.action}`);
          });
        });
        const permissionNames = Array.from(permissionSet);

        // Get accessible menus based on permissions
        const accessibleMenus = await prisma.menu.findMany({
          where: {
            isActive: true,
            OR: [
              { requiredPermission: { in: permissionNames } },
              { requiredPermission: null } // Parent menus without specific permission
            ]
          },
          orderBy: [
            { orderIndex: 'asc' },
            { name: 'asc' }
          ]
        });

        // Build hierarchical structure
        return this.buildPermissionBasedMenuTree(accessibleMenus, permissionNames);
      },
      300 // Cache for 5 minutes
    );
  }

  /**
   * Build hierarchical menu tree filtering by accessible permissions
   * @param {Array} menus - All menus
   * @param {Array} permissionNames - User's permission names
   * @returns {Array} - Hierarchical menu structure
   */
  buildPermissionBasedMenuTree(menus, permissionNames) {
    // Separate parent and child menus
    const parentMenus = menus.filter(m => !m.parentId);
    const childMenus = menus.filter(m => m.parentId && permissionNames.includes(m.requiredPermission));
    
    // Get parent IDs that have accessible children
    const parentIdsWithChildren = new Set(childMenus.map(c => c.parentId));
    
    // Filter valid parents (either has permission or has accessible children)
    const validParents = parentMenus.filter(p => 
      permissionNames.includes(p.requiredPermission) || parentIdsWithChildren.has(p.id)
    );

    // Build result
    const result = [];
    const menuMap = new Map();

    validParents.forEach(parent => {
      const parentMenu = {
        id: parent.id,
        name: parent.name,
        path: parent.path,
        icon: parent.icon,
        order: parent.orderIndex,
        children: []
      };
      menuMap.set(parent.id, parentMenu);
      result.push(parentMenu);
    });

    // Add children to parents
    childMenus.forEach(child => {
      if (menuMap.has(child.parentId)) {
        menuMap.get(child.parentId).children.push({
          id: child.id,
          name: child.name,
          path: child.path,
          icon: child.icon,
          order: child.orderIndex
        });
      }
    });

    // Sort children by order
    result.forEach(parent => {
      parent.children.sort((a, b) => a.order - b.order);
    });

    // Sort parents by order
    result.sort((a, b) => a.order - b.order);

    return result;
  }

  /**
   * Get sidebar navigation for a specific role using SQL view
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} - Hierarchical menu structure
   */
  async getRoleSidebarByView(roleId) {
    const cacheKey = createCacheKey("sidebar_view", roleId);

    return await cacheOrFetch(
      cacheKey,
      async () => {
        const result = await prisma.$queryRaw`
          SELECT * FROM vw_permission_sidebar_navigation 
          WHERE role_id = ${roleId}
          ORDER BY parent_order, parent_name, child_order, child_name
        `;

        return this.transformViewResultToHierarchy(result);
      },
      300
    );
  }

  /**
   * Get menu hierarchy from view
   * @returns {Promise<Array>} - Menu hierarchy
   */
  async getMenuHierarchy() {
    const cacheKey = createCacheKey("menu_hierarchy");

    return await cacheOrFetch(
      cacheKey,
      async () => {
        return prisma.$queryRaw`
          SELECT * FROM vw_menu_hierarchy 
          ORDER BY level, order_index, menu_name
        `;
      },
      600
    );
  }

  /**
   * Get role menu summary from view
   * @returns {Promise<Array>} - Role menu summary
   */
  async getRoleMenuSummary() {
    return prisma.$queryRaw`
      SELECT * FROM vw_role_menu_summary 
      ORDER BY nama_role
    `;
  }

  /**
   * Get role menu permissions from view
   * @param {string} roleId - Optional role ID filter
   * @returns {Promise<Array>} - Role menu permissions
   */
  async getRoleMenuPermissions(roleId = null) {
    if (roleId) {
      return prisma.$queryRaw`
        SELECT * FROM vw_role_menu_permissions 
        WHERE role_id = ${roleId}
        ORDER BY role_display_name, parent_menu, menu_name
      `;
    }
    return prisma.$queryRaw`
      SELECT * FROM vw_role_menu_permissions 
      ORDER BY role_display_name, parent_menu, menu_name
    `;
  }

  /**
   * Get available menus for a role from view
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} - Available menus
   */
  async getAvailableMenuByRole(roleId) {
    return prisma.$queryRaw`
      SELECT * FROM vw_available_menu_by_role 
      WHERE role_id = ${roleId} 
      ORDER BY order_index, menu_name
    `;
  }

  /**
   * Get unassigned menus for a role from view
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} - Unassigned menus
   */
  async getUnassignedMenuByRole(roleId) {
    return prisma.$queryRaw`
      SELECT * FROM vw_unassigned_menu_by_role 
      WHERE role_id = ${roleId} 
      ORDER BY order_index, menu_name
    `;
  }

  /**
   * Get menu usage statistics from view
   * @returns {Promise<Array>} - Menu usage statistics
   */
  async getMenuUsageStatistics() {
    return prisma.$queryRaw`
      SELECT * FROM vw_menu_usage_statistics 
      ORDER BY assigned_roles_count DESC, menu_name
    `;
  }

  /**
   * Get most accessed menus from view
   * @param {number} limit - Limit results
   * @returns {Promise<Array>} - Most accessed menus
   */
  async getMostAccessedMenu(limit = 10) {
    return prisma.$queryRaw`
      SELECT * FROM vw_most_accessed_menu 
      ORDER BY role_count DESC, menu_name 
      LIMIT ${limit}
    `;
  }

  /**
   * Get menu in JSON format from view
   * @returns {Promise<Array>} - Menu JSON
   */
  async getMenuJson() {
    return prisma.$queryRaw`
      SELECT * FROM vw_menu_json 
      WHERE is_active = true 
      ORDER BY order_index, menu_name
    `;
  }

  /**
   * Get role menu JSON from view
   * @param {string} roleId - Optional role ID filter
   * @returns {Promise<Array>} - Role menu JSON
   */
  async getRoleMenuJson(roleId = null) {
    if (roleId) {
      return prisma.$queryRaw`
        SELECT * FROM vw_role_menu_json 
        WHERE role_id = ${roleId}
        ORDER BY nama_role
      `;
    }
    return prisma.$queryRaw`
      SELECT * FROM vw_role_menu_json 
      ORDER BY nama_role
    `;
  }

  /**
   * Get menu role system summary from view
   * @returns {Promise<Object>} - System summary
   */
  async getMenuRoleSystemSummary() {
    const result = await prisma.$queryRaw`
      SELECT * FROM vw_menu_role_system_summary
    `;
    return result[0] || null;
  }

  /**
   * Transform view result to hierarchical structure
   * @param {Array} viewResult - Raw view result
   * @returns {Array} - Hierarchical menu structure
   */
  transformViewResultToHierarchy(viewResult) {
    const parentMenuMap = new Map();
    const result = [];

    for (const item of viewResult) {
      if (!parentMenuMap.has(item.parent_id)) {
        const parentMenu = {
          id: item.parent_id,
          name: item.parent_name,
          path: item.parent_path,
          icon: item.parent_icon,
          order: Number(item.parent_order),
          children: []
        };
        result.push(parentMenu);
        parentMenuMap.set(item.parent_id, parentMenu);
      }

      if (item.child_id && item.has_view_permission) {
        const parentMenu = parentMenuMap.get(item.parent_id);
        if (!parentMenu.children.find(c => c.id === item.child_id)) {
          parentMenu.children.push({
            id: item.child_id,
            name: item.child_name,
            path: item.child_path,
            icon: item.child_icon,
            order: Number(item.child_order)
          });
        }
      }
    }

    // Sort
    result.sort((a, b) => a.order - b.order);
    result.forEach(parent => {
      parent.children.sort((a, b) => a.order - b.order);
    });

    return result;
  }
}

module.exports = new MenuService();