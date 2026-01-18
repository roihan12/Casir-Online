const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { ResponseError } = require("../error/responseError");
const { validate } = require("../validation/validation");
const { CreateMenuValidation, UpdateMenuValidation } = require("../validation/menuValidation");
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
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "CREATE",
        resource: "Menu",
        resourceId: newMenu.id,
        oldValues: null,
        newValues: JSON.stringify(newMenu),
        ipAddress: auditInfo.ipAddress,
      },
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
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "UPDATE",
        resource: "Menu",
        resourceId: menuId,
        oldValues: JSON.stringify(oldValues),
        newValues: JSON.stringify(updatedMenu),
        ipAddress: auditInfo.ipAddress,
      },
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
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "DELETE",
        resource: "Menu",
        resourceId: menuId,
        oldValues: JSON.stringify(existingMenu),
        newValues: null,
        ipAddress: auditInfo.ipAddress,
      },
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
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "CREATE",
        resource: "RoleMenu",
        resourceId: roleMenu.id,
        oldValues: null,
        newValues: JSON.stringify({
          roleId,
          menuId,
          roleName: role.namaRole,
          menuName: menu.name,
        }),
        ipAddress: auditInfo.ipAddress,
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
    await prisma.auditLog.create({
      data: {
        userId: auditInfo.userId,
        action: "DELETE",
        resource: "RoleMenu",
        resourceId: roleMenuId,
        oldValues: JSON.stringify(roleMenuData),
        newValues: null,
        ipAddress: auditInfo.ipAddress,
      },
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
        await prisma.auditLog.create({
          data: {
            userId: auditInfo.userId,
            action: "CREATE",
            resource: "RoleMenu",
            resourceId: roleMenu.id,
            oldValues: null,
            newValues: JSON.stringify({
              roleId,
              menuId,
              roleName: role.namaRole,
              menuName: roleMenu.menu.name,
            }),
            ipAddress: auditInfo.ipAddress,
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
}

module.exports = new MenuService();