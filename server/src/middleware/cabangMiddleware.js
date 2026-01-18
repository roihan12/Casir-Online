const cabangAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const cabangId =
      req.params.cabangId || req.body.cabangId || req.query.cabangId;

    if (!cabangId) {
      return next();
    }

    // Super Admin can access all branches
    const isSuperAdmin = user.userRoles.some(
      (ur) => ur.role.namaRole === "super_admin"
    );

    if (isSuperAdmin) {
      return next();
    }

    // Check if user has access to requested branch
    const hasAccess = user.userCabang.some((uc) => uc.cabangId === cabangId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have access to this branch",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = { cabangAccess };
