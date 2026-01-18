const permissionService = require("../services/permissionService");
const roleService = require("../services/roleService");

/**
 * Middleware untuk mengecek permission
 * @param {string|string[]} requiredPermissions - Permission yang dibutuhkan
 * @param {boolean} requireAll - Jika true, user harus memiliki semua permission, jika false cukup salah satu
 */
const checkPermissions = (requiredPermissions, requireAll = true) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const cabangId = req.user.cabangId;

      // Convert single permission to array
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      if (requireAll) {
        // Harus punya semua permission
        const hasAllPermissions = await permissionService.hasPermissions(
          userId,
          cabangId,
          permissions
        );

        if (!hasAllPermissions) {
          return res.status(403).json({
            status: "error",
            message:
              "Anda tidak memiliki izin yang cukup untuk mengakses resource ini",
          });
        }
      } else {
        // Cukup punya salah satu permission
        const hasAnyPermission = await Promise.all(
          permissions.map((permission) =>
            permissionService.hasPermission(userId, cabangId, permission)
          )
        );

        if (!hasAnyPermission.some(Boolean)) {
          return res.status(403).json({
            status: "error",
            message:
              "Anda tidak memiliki izin yang cukup untuk mengakses resource ini",
          });
        }
      }

      next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat memeriksa izin akses",
      });
    }
  };
};

/**
 * Middleware untuk mengecek akses ke modul
 * @param {string|string[]} modules - Modul yang ingin diakses
 * @param {boolean} requireAll - Jika true, user harus bisa akses semua modul
 */
const checkModuleAccess = (modules, requireAll = true) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const cabangId = req.user.cabangId;

      // Convert single module to array
      const moduleList = Array.isArray(modules) ? modules : [modules];

      const moduleAccess = await Promise.all(
        moduleList.map((module) =>
          permissionService.hasModuleAccess(userId, cabangId, module)
        )
      );

      const hasAccess = requireAll
        ? moduleAccess.every(Boolean) // Harus bisa akses semua modul
        : moduleAccess.some(Boolean); // Cukup bisa akses salah satu modul

      if (!hasAccess) {
        return res.status(403).json({
          status: "error",
          message: "Anda tidak memiliki akses ke modul yang diperlukan",
        });
      }

      next();
    } catch (error) {
      console.error("Module access check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat memeriksa akses modul",
      });
    }
  };
};

/**
 * Middleware untuk mengecek role
 * @param {string|string[]} roles - Role yang diizinkan
 * @param {boolean} requireAll - Jika true, user harus memiliki semua role
 */
const checkRoles = (roles, requireAll = false) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const cabangId = req.user.cabangId;

      // Get user roles
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          cabangId,
          role: {
            status: "aktif",
            deletedAt: null,
          },
        },
        include: {
          role: true,
        },
      });

      const userRoleNames = userRoles.map((ur) => ur.role.namaRole);

      // Convert single role to array
      const requiredRoles = Array.isArray(roles) ? roles : [roles];

      const hasAccess = requireAll
        ? requiredRoles.every((role) => userRoleNames.includes(role))
        : requiredRoles.some((role) => userRoleNames.includes(role));

      if (!hasAccess) {
        return res.status(403).json({
          status: "error",
          message: "Anda tidak memiliki role yang diperlukan",
        });
      }

      next();
    } catch (error) {
      console.error("Role check error:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat memeriksa role",
      });
    }
  };
};

module.exports = {
  checkPermissions,
  checkModuleAccess,
  checkRoles,
};
