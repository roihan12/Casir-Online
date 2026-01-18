const menuService = require("../services/menuService");
const { ResponseError } = require("../error/responseError");

/**
 * Get all menus
 */
async function getAllMenus(req, res, next) {
  try {
    const menus = await menuService.getAllMenus();
    res.status(200).json({
      status: true,
      message: "Get all menus success",
      data: menus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get menu by ID
 */
async function getMenuById(req, res, next) {
  try {
    const menuId = req.params.menuId;
    const menu = await menuService.getMenuById(menuId);
    res.status(200).json({
      status: true,
      message: "Get menu success",
      data: menu,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new menu
 */
async function createMenu(req, res, next) {
  try {
    const menuData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const newMenu = await menuService.createMenu(menuData, auditInfo);
    res.status(201).json({
      status: true,
      message: "Create menu success",
      data: newMenu,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing menu
 */
async function updateMenu(req, res, next) {
  try {
    const menuId = req.params.menuId;
    const menuData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedMenu = await menuService.updateMenu(menuId, menuData, auditInfo);
    res.status(200).json({
      status: true,
      message: "Update menu success",
      data: updatedMenu,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a menu
 */
async function deleteMenu(req, res, next) {
  try {
    const menuId = req.params.menuId;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await menuService.deleteMenu(menuId, auditInfo);
    res.status(200).json({
      status: true,
      message: "Delete menu success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get menus for a specific role
 */
async function getRoleMenus(req, res, next) {
  try {
    const roleId = req.params.roleId;
    const menus = await menuService.getRoleMenus(roleId);
    res.status(200).json({
      status: true,
      message: "Get role menus success",
      data: menus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get menus for the current user
 */
async function getUserMenus(req, res, next) {
  try {
    const userId = req.user.id;
    const cabangId = req.params.cabangId;

    const menus = await menuService.getUserMenus(userId, cabangId);
    res.status(200).json({
      status: true,
      message: "Get user menus success",
      data: menus,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Assign a menu to a role
 */
async function assignMenuToRole(req, res, next) {
  try {
    const { roleId, menuId } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await menuService.assignMenuToRole(roleId, menuId, auditInfo);
    res.status(201).json({
      status: true,
      message: "Menu assigned to role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Remove a menu from a role
 */
async function removeMenuFromRole(req, res, next) {
  try {
    const roleMenuId = req.params.roleMenuId;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await menuService.removeMenuFromRole(roleMenuId, auditInfo);
    res.status(200).json({
      status: true,
      message: "Menu removed from role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk assign menus to a role
 */
async function bulkAssignMenusToRole(req, res, next) {
  try {
    const { roleId, menuIds } = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await menuService.bulkAssignMenusToRole(roleId, menuIds, auditInfo);
    res.status(201).json({
      status: true,
      message: "Menus assigned to role successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllMenus,
  getMenuById,
  createMenu,
  updateMenu,
  deleteMenu,
  getRoleMenus,
  getUserMenus,
  assignMenuToRole,
  removeMenuFromRole,
  bulkAssignMenusToRole,
};