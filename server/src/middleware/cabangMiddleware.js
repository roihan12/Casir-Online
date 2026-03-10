const { logger } = require("../utils/logger");

/**
 * Middleware to check branch access
 * Works with both formatted (roles/cabang) and raw (userRoles/userCabang) user objects
 * Supports single cabangId or comma-separated multiple cabangIds
 */
const cabangAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const cabangId =
      req.params.cabangId || req.body.cabangId || req.query.cabangId;

    if (!cabangId) {
      return next();
    }

    // Skip validation if cabangId is "all"
    if (cabangId === "all") {
      return next();
    }

    // Get roles and cabang from user object (handle both formats)
    const roles = user.roles || user.userRoles || [];
    const cabangList = user.cabang || user.userCabang || [];

    // Super Admin can access all branches
    const isSuperAdmin = roles.some(
      (r) => r.namaRole === "super_admin" || r.role?.namaRole === "super_admin"
    );

    if (isSuperAdmin) {
      return next();
    }

    // Handle multiple cabangIds (comma-separated)
    const requestedCabangIds = cabangId.includes(',') 
      ? cabangId.split(',').map(id => id.trim()).filter(id => id.length > 0)
      : [cabangId];

    // Get user's accessible cabang IDs
    const userCabangIds = cabangList.map((uc) => uc.cabangId || uc.id);

    // Check if user has access to ALL requested branches
    const hasAccessToAll = requestedCabangIds.every((requestedId) =>
      userCabangIds.includes(requestedId)
    );

    if (!hasAccessToAll) {
      const unauthorizedBranches = requestedCabangIds.filter(
        (id) => !userCabangIds.includes(id)
      );
      
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to the requested branch(es)",
        unauthorizedBranches,
      });
    }

    next();
  } catch (error) {
    logger.error("CabangMiddleware Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { cabangAccess };
