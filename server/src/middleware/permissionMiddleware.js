const { cacheGet, cacheSet, createCacheKey } = require("../utils/redisUtils");
const prisma = require("../config/db");
const { logger } = require("../utils/logger");


// Cache permissions for 1 hour
const PERMISSIONS_CACHE_TTL = 3600;

/**
 * Get permissions for a role from cache or database
 */
const getRolePermissions = async (roleId) => {
  const cacheKey = createCacheKey("role_permissions", roleId);

  const cachedPermissions = await cacheGet(cacheKey);
  if (cachedPermissions) return cachedPermissions;

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
    },
  });

  if (!role) return null;

  const permissions = role.permissions.map(rp => (`${rp.permission.module}:${rp.permission.action}`));
  
  await cacheSet(cacheKey, permissions, PERMISSIONS_CACHE_TTL);
  return permissions;
};

/**
 * Check if user has required permissions, with optional branch scoping
 */
const checkPermissions = async (user, requiredPermissions, requireBranch = false) => {
  // Super admin bypass - Defensive check for roles
  const roles = user.roles || [];
  const isSuperAdmin = roles.some(role => role.namaRole === "super_admin");
  if (isSuperAdmin) return true;

  // Use permissions from user object if available (set by authService)
  let userPermissions;
  if (user.permissions) {
    userPermissions = new Set(user.permissions);
  } else {
    // Fallback if permissions not in user object
    userPermissions = new Set();
    const roles = user.roles || [];
    for (const role of roles) {
      const rolePerms = await getRolePermissions(role.roleId);
      if (rolePerms) {
        rolePerms.forEach(p => userPermissions.add(p));
      }
    }
  }

  // Basic permission check
  const hasBasePermissions = requiredPermissions.every(p => userPermissions.has(p));
  if (!hasBasePermissions) return false;

  return true;
};

/**
 * Enhanced hasPermission middleware
 * @param {string[]} requiredPermissions - List of module:action permissions
 * @param {Object} options - { checkBranch: boolean }
 */
const hasPermission = (requiredPermissions, options = {}) => {
  return async (req, res, next) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: User not authenticated",
        });
      }

      // Check permissions
      const hasRequiredPermissions = await checkPermissions(user, requiredPermissions);

      if (!hasRequiredPermissions) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: Insufficient permissions",
        });
      }


      // Branch Scoping Check (Optional)
      // If a branchId is provided in params/body/query, ensure user belongs to it
      if (options.checkBranch && user.roles[0].namaRole !== "super_admin") {
        const targetCabangId = req.params.cabangId || req.body.cabangId || req.query.cabangId;
        if (targetCabangId) {
          const roles = user.roles || [];
          const hasAccessToBranch = roles.some(r => r.cabangId === targetCabangId || !r.cabangId); // null cabangId means global/superadmin
          if (!hasAccessToBranch) {
            return res.status(403).json({
              success: false,
              message: "Forbidden: You do not have access to this branch",
            });
          }
        }
      }

      next();
    } catch (error) {
      logger.error("Permission check error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error during permission check",
      });
    }
  };
};

module.exports = { hasPermission };
