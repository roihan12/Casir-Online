const bcrypt = require("bcrypt");
const prisma = require("../config/db");
const {
  cacheSet,
  cacheGet,
  cacheDelete,
  createCacheKey,
  calculateTtl,
} = require("../utils/redisUtils");
const { generateToken } = require("../utils/jwt");
const { loginUserValidation } = require("../validation/authValidation");
const { validate } = require("../validation/validation");
const { ResponseError } = require("../error/responseError");

/**
 * Helper to get unified permissions for a user across all roles
 */
const getUnifiedPermissions = async (userId) => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
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
  const isSuperAdmin = userRoles.some(ur => ur.role.namaRole === "super_admin");

  if (isSuperAdmin) {
    // If super admin, they have all permissions conceptually, 
    // but for the UI it's better to return the full list or a special flag.
    // Let's return all permissions available in the system.
    const allPermissions = await prisma.permission.findMany();
    return allPermissions.map(p => `${p.module}:${p.action}`);
  }

  userRoles.forEach((ur) => {
    ur.role.permissions.forEach((rp) => {
      permissionSet.add(`${rp.permission.module}:${rp.permission.action}`);
    });
  });

  return Array.from(permissionSet);
};

/**
 * Helper to format user data consistently for session and client response
 */
const formatUserData = (user, permissions) => {
  return {
    id: user.id,
    username: user.username,
    namaLengkap: user.namaLengkap,
    email: user.email,
    avatarUrl: user.avatarUrl,
    status: user.status,
    telepon: user.telepon,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.userRoles?.map((ur) => ({
      roleId: ur.roleId,
      namaRole: ur.role.namaRole,
      cabangId: ur.cabangId,
      namaCabang: ur.cabang?.namaCabang || "Global",
    })) || [],
    cabang: user.userCabang?.map((uc) => ({
      cabangId: uc.cabangId,
      namaCabang: uc.cabang.namaCabang,
      isPrimary: uc.isPrimary,
    })) || [],
    permissions,
  };
};

const login = async (username, password, ipAddress, userAgent) => {
  try {
    // Validasi input
    validate(loginUserValidation, {
      username,
      password,
      ip: ipAddress,
      userAgent,
    });

    // Cari user dengan relasi
    const user = await prisma.user.findUnique({
      where: { username },
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

    // Verifikasi status user
    if (!user || user.status !== "aktif") {
      throw new ResponseError(
        401,
        "Username or password is incorrect or inactive account"
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ResponseError(401, "Username or password is incorrect");
    }

    // Get unified permissions
    const permissions = await getUnifiedPermissions(user.id);

    // Buat tanggal kedaluwarsa
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Expires in 1 day

    // Buat sesi baru
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        token: `session_${Date.now()}`,
        ipAddress,
        userAgent,
        lastActivity: new Date(),
        expiredAt: expiresAt,
      },
    });

    // Format data user secara konsisten
    const userData = formatUserData(user, permissions);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Simpan data ke Redis menggunakan utilitas global
    const sessionKey = createCacheKey("session", session.id);
    const userKey = createCacheKey("user", user.id);

    const sessionData = {
      user: userData,
      expiresAt: session.expiredAt,
    };

    const sessionTtl = calculateTtl(expiresAt);

    await Promise.all([
      cacheSet(sessionKey, sessionData, sessionTtl),
      cacheSet(userKey, userData, 86400), // 1 hari
    ]);

    // Kembalikan data yang diperlukan
    return {
      user: userData,
      token,
      expiresAt: session.expiredAt,
      sessionId: session.id,
    };
  } catch (error) {
    // Pastikan response error dari validasi atau database dikembalikan dengan benar
    if (error instanceof ResponseError) {
      throw error;
    }
    // Log error untuk debugging
    console.error("Login error:", error);
    throw new ResponseError(500, "Internal server error during login");
  }
};

const logout = async (sessionId) => {
  // Hapus dari database
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });

  if (session) {
    // Hapus dari Redis
    const sessionKey = createCacheKey("session", sessionId);
    const userKey = createCacheKey("user", session.userId);

    await cacheDelete(sessionKey);
    await cacheDelete(userKey);

    // Hapus dari database
    await prisma.userSession.delete({
      where: { id: sessionId },
    });
  }

  return { success: true };
};

const getProfile = async (id) => {
  // Coba dapatkan dari Redis dulu menggunakan utilitas global
  const userKey = createCacheKey("user", id);
  const cachedUser = await cacheGet(userKey);

  if (cachedUser) {
    return { user: cachedUser };
  }

  // Jika tidak ada di cache, ambil dari database
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: {
          role: true,
          cabang: true,
        },
      },
      userCabang: {
        include: {
          cabang: true,
        },
      },
    },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  // Get unified permissions
  const permissions = await getUnifiedPermissions(user.id);

  const userData = formatUserData(user, permissions);

  // Simpan ke Redis untuk penggunaan berikutnya
  await cacheSet(userKey, userData, 86400); // 1 hari

  return { user: userData };
};

module.exports = {
  getProfile,
  login,
  logout,
  formatUserData,
};
