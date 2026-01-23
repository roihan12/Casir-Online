const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");
const { authenticate } = require("../middleware/authMiddleware");
const { hasPermission } = require("../middleware/permissionMiddleware");

// Get all menus
router.get("/", authenticate, hasPermission(["menu:read"]), menuController.getAllMenus);

// Get menu by ID
router.get("/:menuId", authenticate, hasPermission(["menu:read"]), menuController.getMenuById);

// Get menus for a specific role
router.get("/role/:roleId", authenticate, hasPermission(["menu:read"]), menuController.getRoleMenus);

// Get menus for the current user in a specific branch
router.get("/user/cabang/:cabangId", authenticate, menuController.getUserMenus);

// Create a new menu 
router.post("/", authenticate, hasPermission(["menu:manage"]), menuController.createMenu);

// Update an existing menu 
router.put("/:menuId", authenticate, hasPermission(["menu:manage"]), menuController.updateMenu);

// Update menu status
router.put("/:menuId/status", authenticate, hasPermission(["menu:manage"]), menuController.updateMenuStatus);

// Delete a menu 
router.delete("/:menuId", authenticate, hasPermission(["menu:manage"]), menuController.deleteMenu);

// Assign a menu to a role 
router.post("/assign", authenticate, hasPermission(["menu:manage"]), menuController.assignMenuToRole);

// Bulk assign menus to a role 
router.post("/bulk-assign", authenticate, hasPermission(["menu:manage"]), menuController.bulkAssignMenusToRole);

// Remove a menu from a role 
router.delete("/assign/:roleMenuId", authenticate, hasPermission(["menu:manage"]), menuController.removeMenuFromRole);

module.exports = router;