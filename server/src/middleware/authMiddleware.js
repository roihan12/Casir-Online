const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/db");
const {
  cacheGet,
  cacheSet,
  cacheDelete,
  createCacheKey,
  calculateTtl,
} = require("../utils/redisUtils");
const { formatUserData } = require("../services/authService");

const authenticate = async (req, res, next) => {
  try {
    // Get token from cookie instead of Authorization header
    const token = req.cookies.auth_token;
    const sessionId = req.cookies.session_id;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token is required",
      });
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Check if session ID from cookie matches the one in the token
    if (sessionId && decoded.sessionId !== sessionId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Session mismatch",
      });
    }
    let sessionKey;
    // Cek sesi dari Redis dulu menggunakan utilitas global
    sessionKey = createCacheKey("session", decoded.sessionId);
    const cachedSession = await cacheGet(sessionKey);

    if (cachedSession) {
      // Verifikasi waktu expired
      if (new Date(cachedSession.expiresAt) < new Date()) {
        // Hapus data Redis & cookies jika sudah expired
        const userKey = createCacheKey("user", decoded.userId);

        await cacheDelete(sessionKey);
        await cacheDelete(userKey);

        res.clearCookie("auth_token", { path: "/" });
        res.clearCookie("session_id", { path: "/" });

        return res.status(401).json({
          success: false,
          message: "Unauthorized: Session expired",
        });
      }

      // Get user data dari Redis
      const userKey = createCacheKey("user", decoded.userId);
      const cachedUser = await cacheGet(userKey);


      if (cachedUser) {
        // Set user data di request
        req.user = cachedUser;
        req.sessionId = decoded.sessionId;

        // Update last activity di database (bisa dijadikan operasi background)
        updateLastActivity(decoded.sessionId);

        return next();
      }
    }

    // Fallback ke database jika tidak ada di Redis
    // Check if session exists
    const session = await prisma.userSession.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || new Date(session.expiredAt) < new Date()) {
      // Clear invalid cookies
      res.clearCookie("auth_token", { path: "/" });
      res.clearCookie("session_id", { path: "/" });

      return res.status(401).json({
        success: false,
        message: "Unauthorized: Session expired or invalid",
      });
    }

    // Get user with roles
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                namaRole: true,
              },
            },
          },
        },
        userCabang: {
          include: {
            cabang: {
              select: {
                id: true,
                namaCabang: true,
                alamat: true,
                telepon: true,
                latitude: true,
                longitude: true,
                radiusGeofence: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== "aktif") {
      // Clear cookies if user is invalid
      res.clearCookie("auth_token", { path: "/" });
      res.clearCookie("session_id", { path: "/" });

      return res.status(401).json({
        success: false,
        message: "Unauthorized: User inactive or not found",
      });
    }

    // Set user data in request
    req.user = user;
    req.sessionId = decoded.sessionId;

    // Update last activity
    updateLastActivity(decoded.sessionId);

    // Get permissions for consistent user object
    const userRolesWithPerms = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionSet = new Set();
    const isSuperAdmin = userRolesWithPerms.some(ur => ur.role.namaRole === "super_admin");
    let permissions = [];
    
    if (isSuperAdmin) {
      const allPermissions = await prisma.permission.findMany();
      permissions = allPermissions.map(p => `${p.module}:${p.action}`);
    } else {
      userRolesWithPerms.forEach((ur) => {
        ur.role.permissions.forEach((rp) => {
          permissionSet.add(`${rp.permission.module}:${rp.permission.action}`);
        });
      });
      permissions = Array.from(permissionSet);
    }

    // Simpan ke Redis untuk request berikutnya menggunakan formatter konsisten
    const userData = formatUserData(user, permissions);

    // Update req.user to be the consistent object
    req.user = userData;

    // Simpan sesi dan user data ke Redis menggunakan utilitas global
    sessionKey = createCacheKey("session", decoded.sessionId);
    const userKey = createCacheKey("user", user.id);

    const sessionTtl = calculateTtl(session.expiredAt);

    await cacheSet(
      sessionKey,
      {
        user: userData,
        expiresAt: session.expiredAt,
      },
      sessionTtl
    );

    await cacheSet(userKey, userData, 86400); // 1 hari

    next();
  } catch (error) {
    // Clear cookies on error
    res.clearCookie("auth_token", { path: "/" });
    res.clearCookie("session_id", { path: "/" });

    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};

// Fungsi untuk update lastActivity (dijalankan asynchronous)
const updateLastActivity = async (sessionId) => {
  try {
    await prisma.userSession.updateMany({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.error("Error updating last activity:", error);
  }
};

module.exports = { authenticate };
