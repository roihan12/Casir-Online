/**
 * Middleware to check branch access
 * Works with both formatted (roles/cabang) and raw (userRoles/userCabang) user objects
 */
const cabangAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const cabangId =
      req.params.cabangId || req.body.cabangId || req.query.cabangId;

    if (!cabangId) {
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

    // Check if user has access to requested branch
    const hasAccess = cabangList.some((uc) => uc.cabangId === cabangId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this branch",
      });
    }

    next();
  } catch (error) {
    console.error("CabangMiddleware Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { cabangAccess };
