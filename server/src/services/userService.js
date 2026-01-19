const bcrypt = require("bcrypt");
const prisma = require("../config/db");
const { validate } = require("../validation/validation");
const { ResponseError } = require("../error/responseError");
const {
  userCreateSchema,
  userUpdateSchema,
  userStatusChangeSchema,
  passwordResetSchema,
  userActivityLogSchema,
} = require("../validation/userValidation");
const { createAuditLog } = require("../utils/auditLog");
const {
  cacheGet,
  cacheSet,
  cacheDelete,
  createCacheKey,
  cacheOrFetch,
  cacheDeletePattern,
} = require("../utils/redisUtils");
const userDashboardService = require("./userDashboardService");

// Cache constants
const CACHE_KEYS = {
  USER_LIST: "user:list",
  USER_DETAIL: "user:detail",
  USER_ACTIVITY: "user:activity",
};

// TTL for cache (in seconds)
const CACHE_TTL = {
  USER_LIST: 600, // 10 minutes
  USER_DETAIL: 900, // 15 minutes
  USER_ACTIVITY: 300, // 5 minutes
};

/**
 * Get all users with optional filtering
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} - Users with pagination data and stats
 */
const getAllUsers = async (filters = {}) => {
  const { search, roleId, cabangId, status, page = 1, limit = 10 } = filters;

  // Create cache key based on provided filters
  const cacheKey = createCacheKey(
    CACHE_KEYS.USER_LIST,
    `${search || "all"}_${roleId || "all"}_${cabangId || "all"}_${
      status || "all"
    }_${page}_${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const where = {
        deletedAt: null,
        ...(search && {
          OR: [
            { username: { contains: search } },
            { namaLengkap: { contains: search } },
            { email: { contains: search } },
          ],
        }),
        ...(status && { status }),
        ...(roleId && {
          userRoles: {
            some: { roleId },
          },
        }),
        ...(cabangId && {
          userCabang: {
            some: { cabangId },
          },
        }),
      };

      const skip = (page - 1) * limit;

      // Fetch data, total count, and status counts in parallel
      const [data, total, activeCount, inactiveCount] = await Promise.all([
        prisma.user.findMany({
          where,
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
          skip,
          take: Number(limit),
        }),
        prisma.user.count({ where }),
        // Count active users (global, tidak terpengaruh filter search)
        prisma.user.count({ 
          where: { 
            deletedAt: null, 
            status: "aktif" 
          } 
        }),
        // Count inactive users (global)
        prisma.user.count({ 
          where: { 
            deletedAt: null, 
            status: "nonaktif" 
          } 
        }),
      ]);

      // Transform data to hide password
      const transformedData = data.map(sanitizeUserData);

      const totalPages = Math.ceil(total / limit);

      return {
        data: transformedData,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        stats: {
          totalUsers: activeCount + inactiveCount,
          activeUsers: activeCount,
          inactiveUsers: inactiveCount,
        },
      };
    },
    CACHE_TTL.USER_LIST
  );
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} - User data without password or null if not found
 */
const getUserById = async (id) => {
  const cacheKey = createCacheKey(CACHE_KEYS.USER_DETAIL, id);

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const user = await prisma.user.findUnique({
        where: {
          id,
          deletedAt: null,
        },
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
        return null;
      }

      return sanitizeUserData(user);
    },
    CACHE_TTL.USER_DETAIL
  );
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {Object} auditInfo - Info for audit log
 * @returns {Promise<Object>} - Created user without password
 */
const createUser = async (userData, auditInfo) => {
  // Validate input data
  const validData = validate(userCreateSchema, userData);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(validData.password, salt);

  const { userRoles, userCabang, ...userDataWithoutRelations } = validData;

  return prisma.$transaction(
    async (prisma) => {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: userDataWithoutRelations.username },
      });

      if (existingUser) {
        throw new ResponseError(400, "Username already exists");
      }

      // Validate cabang IDs exist
      if (userCabang && userCabang.length > 0) {
        const cabangIds = userCabang.map((cabang) => cabang.cabangId);
        const existingCabangs = await prisma.cabang.findMany({
          where: {
            id: {
              in: cabangIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingCabangIds = existingCabangs.map((cabang) => cabang.id);
        const nonExistingCabangIds = cabangIds.filter(
          (id) => !existingCabangIds.includes(id)
        );

        if (nonExistingCabangIds.length > 0) {
          throw new ResponseError(
            400,
            `Cabang IDs do not exist: ${nonExistingCabangIds.join(", ")}`
          );
        }
      }

      // Validate role IDs exist
      if (userRoles && userRoles.length > 0) {
        const roleIds = userRoles.map((role) => role.roleId);
        const existingRoles = await prisma.role.findMany({
          where: {
            id: {
              in: roleIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingRoleIds = existingRoles.map((role) => role.id);
        const nonExistingRoleIds = roleIds.filter(
          (id) => !existingRoleIds.includes(id)
        );

        if (nonExistingRoleIds.length > 0) {
          throw new ResponseError(
            400,
            `Role IDs do not exist: ${nonExistingRoleIds.join(", ")}`
          );
        }

        // Also validate cabang IDs in userRoles
        const cabangIdsInRoles = userRoles.map((role) => role.cabangId);
        const existingCabangsInRoles = await prisma.cabang.findMany({
          where: {
            id: {
              in: cabangIdsInRoles,
            },
          },
          select: {
            id: true,
          },
        });

        const existingCabangIdsInRoles = existingCabangsInRoles.map(
          (cabang) => cabang.id
        );
        const nonExistingCabangIdsInRoles = cabangIdsInRoles.filter(
          (id) => !existingCabangIdsInRoles.includes(id)
        );

        if (nonExistingCabangIdsInRoles.length > 0) {
          throw new ResponseError(
            400,
            `Cabang IDs in roles do not exist: ${nonExistingCabangIdsInRoles.join(
              ", "
            )}`
          );
        }
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          ...userDataWithoutRelations,
          password: hashedPassword,
          createdBy: auditInfo.createdBy,
          createdByUserId: auditInfo.userId,
        },
      });

      // Create user cabang relationships
      if (userCabang && userCabang.length > 0) {
        await Promise.all(
          userCabang.map((cabang) =>
            prisma.userCabang.create({
              data: {
                userId: user.id,
                cabangId: cabang.cabangId,
                isPrimary: cabang.isPrimary || false,
              },
            })
          )
        );
      }

      // Create user role relationships
      if (userRoles && userRoles.length > 0) {
        await Promise.all(
          userRoles.map((role) =>
            prisma.userRole.create({
              data: {
                userId: user.id,
                roleId: role.roleId,
                cabangId: role.cabangId,
              },
            })
          )
        );
      }

      // Return user without password
      const createdUser = await prisma.user.findUnique({
        where: { id: user.id },
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

      await createAuditLog(prisma, {
        userId: auditInfo.userId,
        userName: auditInfo.createdBy,
        ipAddress: auditInfo.ipAddress,
        cabangId:
          userDataWithoutRelations.cabangId ||
          getUserPrimaryCabangId(createdUser),
        action: "CREATE",
        tableName: "user",
        recordId: createdUser.id,
        oldValues: null,
        newValues: validData,
      });

      // Invalidate cache after creating a new user
      await invalidateUserCache(user.id);

      return sanitizeUserData(createdUser);
    },
    { timeout: 10000 }
  );
};

/**
 * Update user data
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @param {Object} auditInfo - Info for audit log
 * @param {Object|null} avatarFile - Optional avatar file
 * @returns {Promise<Object>} - Updated user without password
 */
const updateUser = async (id, userData, auditInfo, avatarFile = null) => {
  // Validate input data
  const validData = validate(userUpdateSchema, userData);

  // Verify user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new ResponseError(404, "User not found");
  }

  // Prepare user data
  const { userRoles, userCabang, password, ...userDataWithoutRelations } =
    validData;

  return prisma.$transaction(
    async (prisma) => {
      // Validate cabang IDs exist if userCabang is provided
      if (userCabang && userCabang.length > 0) {
        const cabangIds = userCabang.map((cabang) => cabang.cabangId);
        const existingCabangs = await prisma.cabang.findMany({
          where: {
            id: {
              in: cabangIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingCabangIds = existingCabangs.map((cabang) => cabang.id);
        const nonExistingCabangIds = cabangIds.filter(
          (id) => !existingCabangIds.includes(id)
        );

        if (nonExistingCabangIds.length > 0) {
          throw new ResponseError(
            400,
            `Cabang IDs do not exist: ${nonExistingCabangIds.join(", ")}`
          );
        }
      }

      // Handle avatar upload if provided
      if (avatarFile) {
        try {
          // Import dynamically to avoid circular dependency
          const {
            uploadUserAvatar: uploadAvatar,
          } = require("./userAvatarService");
          const updatedUserWithAvatar = await uploadAvatar(
            id,
            avatarFile,
            auditInfo,
            auditInfo.cabangId
          );

          // Update avatar URL for the user update
          updateData.avatarUrl = updatedUserWithAvatar.avatarUrl;
        } catch (error) {
          console.error("Error uploading avatar during user update:", error);
          // Continue with user update even if avatar upload fails
        }
      }

      // Validate role IDs exist if userRoles is provided
      if (userRoles && userRoles.length > 0) {
        const roleIds = userRoles.map((role) => role.roleId);
        const existingRoles = await prisma.role.findMany({
          where: {
            id: {
              in: roleIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingRoleIds = existingRoles.map((role) => role.id);
        const nonExistingRoleIds = roleIds.filter(
          (id) => !existingRoleIds.includes(id)
        );

        if (nonExistingRoleIds.length > 0) {
          throw new ResponseError(
            400,
            `Role IDs do not exist: ${nonExistingRoleIds.join(", ")}`
          );
        }

        // Also validate cabang IDs in userRoles
        const cabangIdsInRoles = userRoles.map((role) => role.cabangId);
        const existingCabangsInRoles = await prisma.cabang.findMany({
          where: {
            id: {
              in: cabangIdsInRoles,
            },
          },
          select: {
            id: true,
          },
        });

        const existingCabangIdsInRoles = existingCabangsInRoles.map(
          (cabang) => cabang.id
        );
        const nonExistingCabangIdsInRoles = cabangIdsInRoles.filter(
          (id) => !existingCabangIdsInRoles.includes(id)
        );

        if (nonExistingCabangIdsInRoles.length > 0) {
          throw new ResponseError(
            400,
            `Cabang IDs in roles do not exist: ${nonExistingCabangIdsInRoles.join(
              ", "
            )}`
          );
        }
      }

      // Update user data
      let updateData = { ...userDataWithoutRelations };

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      if (
        updateData.username &&
        updateData.username !== existingUser.username
      ) {
        const usernameExists = await prisma.user.findUnique({
          where: { username: updateData.username },
        });

        if (usernameExists) {
          throw new ResponseError(400, "Username already exists");
        }
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Update user cabang relationships
      if (userCabang) {
        // Delete existing relationships
        await prisma.userCabang.deleteMany({
          where: { userId: id },
        });

        // Create new relationships
        if (userCabang.length > 0) {
          await Promise.all(
            userCabang.map((cabang) =>
              prisma.userCabang.create({
                data: {
                  userId: user.id,
                  cabangId: cabang.cabangId,
                  isPrimary: cabang.isPrimary || false,
                },
              })
            )
          );
        }
      }

      // Update user role relationships
      if (userRoles) {
        // Delete existing relationships
        await prisma.userRole.deleteMany({
          where: { userId: id },
        });

        // Create new relationships
        if (userRoles.length > 0) {
          await Promise.all(
            userRoles.map((role) =>
              prisma.userRole.create({
                data: {
                  userId: user.id,
                  roleId: role.roleId,
                  cabangId: role.cabangId,
                },
              })
            )
          );
        }
      }

      // Return user without password
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
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

      // Create audit log entry and invalidate cache
      await createAuditLog(prisma, {
        userId: auditInfo.userId,
        ipAddress: auditInfo.ipAddress,
        action: "UPDATE",
        tableName: "user",
        recordId: updatedUser.id,
        oldValues: existingUser,
        newValues: updatedUser,
        cabangId: getUserPrimaryCabangId(updatedUser),
      });

      // Invalidate user cache
      try {
        await invalidateUserCache(id);
      } catch (error) {
        console.error("Error invalidating cache:", error);
      }

      return sanitizeUserData(updatedUser);
    },
    { timeout: 10000 }
  );
};

/**
 * Change user status (activate/deactivate)
 * @param {string} id - User ID
 * @param {Object} statusData - Status update data
 * @param {Object} auditInfo - Info for audit log
 * @returns {Promise<Object>} - Updated user
 */
const changeUserStatus = async (id, statusData, auditInfo) => {
  // Validate status data
  const validData = validate(userStatusChangeSchema, statusData);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
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

  if (!existingUser) {
    throw new ResponseError(404, "User not found");
  }

  // Status hasn't changed
  if (existingUser.status === validData.status) {
    return sanitizeUserData(existingUser);
  }

  return prisma.$transaction(
    async (prisma) => {
      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: validData.status,
          ...(validData.status === "nonaktif" && { deletedAt: new Date() }),
          ...(validData.status === "aktif" && { deletedAt: null }),
        },
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

      // If user is deactivated, delete all active sessions
      if (validData.status === "nonaktif") {
        await prisma.userSession.deleteMany({
          where: { userId: id },
        });
      }

      // Create audit log
      await createAuditLog(prisma, {
        userId: auditInfo.userId,
        ipAddress: auditInfo.ipAddress,
        action: validData.status === "aktif" ? "ACTIVATE" : "DEACTIVATE",
        tableName: "user",
        recordId: id,
        oldValues: { status: existingUser.status },
        newValues: {
          status: validData.status,
          alasan: validData.alasan || null,
        },
        cabangId: getUserPrimaryCabangId(existingUser),
      });

      // Invalidate cache
      await invalidateUserCache(id);

      return sanitizeUserData(updatedUser);
    },
    { timeout: 10000 }
  );
};

/**
 * Soft delete a user
 * @param {string} id - User ID
 * @param {Object} auditInfo - Info for audit log
 * @returns {Promise<Object>} - Deleted user
 */
const deleteUser = async (id, auditInfo) => {
  // Verify user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: true,
      userCabang: true,
    },
  });

  if (!existingUser) {
    throw new ResponseError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      status: "nonaktif",
      deletedAt: new Date(),
    },
  });

  // Delete all active sessions
  await prisma.userSession.deleteMany({
    where: { userId: id },
  });

  // Create audit log
  await createAuditLog(prisma, {
    userId: auditInfo.userId,
    ipAddress: auditInfo.ipAddress,
    action: "DELETE",
    tableName: "user",
    recordId: id,
    oldValues: existingUser,
    newValues: updatedUser,
    cabangId: getUserPrimaryCabangId(existingUser),
  });

  // Invalidate cache after deleting user
  await invalidateUserCache(id);

  return updatedUser;
};

/**
 * Reset user password
 * @param {string} id - User ID
 * @param {Object} passwordData - New password data
 * @param {Object} auditInfo - Info for audit log
 * @returns {Promise<Object>} - Updated user
 */
const resetPassword = async (id, passwordData, auditInfo) => {
  // Validate password data
  const validData = validate(passwordResetSchema, passwordData);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: true,
      userCabang: true,
    },
  });

  if (!existingUser) {
    throw new ResponseError(404, "User not found");
  }

  return prisma.$transaction(
    async (prisma) => {
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(validData.newPassword, salt);

      // Update user password
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          password: hashedPassword,
        },
      });

      // Force logout if requested
      if (validData.forceLogout) {
        await prisma.userSession.deleteMany({
          where: { userId: id },
        });
      }

      // Create audit log
      await createAuditLog(prisma, {
        userId: auditInfo.userId,
        ipAddress: auditInfo.ipAddress,
        action: "RESET_PASSWORD",
        tableName: "user",
        recordId: id,
        oldValues: null,
        newValues: null, // Don't store password data in logs
        cabangId: getUserPrimaryCabangId(existingUser),
      });

      // Invalidate cache
      await invalidateUserCache(id);

      return sanitizeUserData(updatedUser);
    },
    { timeout: 10000 }
  );
};

/**
 * Force logout a user by deleting all their sessions
 * @param {string} id - User ID
 * @param {Object} auditInfo - Info for audit log
 * @returns {Promise<Object>} - Result with count of deleted sessions
 */
const forceLogout = async (id, auditInfo) => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      userCabang: true,
    },
  });

  if (!existingUser) {
    throw new ResponseError(404, "User not found");
  }

  // Delete all user sessions
  const deletedSessions = await prisma.userSession.deleteMany({
    where: { userId: id },
  });

  // Create audit log
  await createAuditLog(prisma, {
    userId: auditInfo.userId,
    ipAddress: auditInfo.ipAddress,
    action: "FORCE_LOGOUT",
    tableName: "user_session",
    recordId: id,
    oldValues: null,
    newValues: null,
    cabangId: getUserPrimaryCabangId(existingUser),
  });

  return {
    userId: id,
    deletedSessionsCount: deletedSessions.count,
    username: existingUser.username,
    status: "success",
  };
};

/**
 * Upload user avatar by delegating to avatar service
 * @param {string} id - User ID
 * @param {object} fileData - File data
 * @param {object} auditInfo - Audit information
 * @returns {Promise<Object>} - User data with updated avatar
 */
const uploadUserAvatar = async (id, fileData, auditInfo) => {
  // Import dynamically to avoid circular dependency
  const { uploadUserAvatar: uploadAvatar } = require("./userAvatarService");
  return await uploadAvatar(id, fileData, auditInfo, auditInfo.cabangId);
};

/**
 * Delete user avatar by delegating to avatar service
 * @param {string} id - User ID
 * @param {object} auditInfo - Audit information
 * @returns {Promise<Object>} - User data with deleted avatar
 */
const deleteUserAvatar = async (id, auditInfo) => {
  // Import dynamically to avoid circular dependency
  const { deleteUserAvatar: deleteAvatar } = require("./userAvatarService");
  return await deleteAvatar(id, auditInfo, auditInfo.cabangId);
};

/**
 * Get user activity logs
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} - Activity logs with pagination
 */
const getUserActivityLogs = async (filters = {}) => {
  // Validate filters
  const validFilters = validate(userActivityLogSchema, filters);

  const {
    userId,
    startDate,
    endDate,
    action,
    tableName,
    ipAddress,
    page = 1,
    limit = 10,
  } = validFilters;

  // Create cache key based on filters
  const cacheKey = createCacheKey(
    CACHE_KEYS.USER_ACTIVITY,
    `${userId || "all"}_${startDate?.toISOString() || "all"}_${
      endDate?.toISOString() || "all"
    }_${action || "all"}_${tableName || "all"}_${
      ipAddress || "all"
    }_${page}_${limit}`
  );

  return await cacheOrFetch(
    cacheKey,
    async () => {
      const where = {
        ...(userId && { user_id: userId }),
        ...(action && { action }),
        ...(tableName && { table_name: tableName }),
        ...(ipAddress && { ip_address: ipAddress }),
        ...(startDate &&
          endDate && {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          }),
        ...(startDate &&
          !endDate && {
            created_at: {
              gte: startDate,
            },
          }),
        ...(!startDate &&
          endDate && {
            created_at: {
              lte: endDate,
            },
          }),
      };

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                username: true,
                namaLengkap: true,
                email: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
          skip,
          take: Number(limit),
        }),
        prisma.auditLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: logs,
        pagination: {
          totalItems: total,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    },
    CACHE_TTL.USER_ACTIVITY
  );
};

/**
 * Invalidate user cache
 * @param {string} userId - User ID or "*" for all users
 */
const invalidateUserCache = async (userId) => {
  try {
    // If userId is "*", invalidate all user caches
    if (userId === "*") {
      await cacheDeletePattern(CACHE_KEYS.USER_LIST + "*");
      await cacheDeletePattern(CACHE_KEYS.USER_DETAIL + "*");
      await cacheDeletePattern(CACHE_KEYS.USER_ACTIVITY + "*");
    } else {
      // Delete specific user cache
      await cacheDelete(createCacheKey(CACHE_KEYS.USER_DETAIL, userId));
      // Delete all list caches that might contain this user
      await cacheDelete(CACHE_KEYS.USER_LIST + "*");
      // Delete activity logs related to this user
      await cacheDelete(CACHE_KEYS.USER_ACTIVITY + "*" + userId + "*");
    }

    // Invalidate dashboard cache
    await userDashboardService.invalidateUserCache();
  } catch (error) {
    console.error("Error invalidating user cache:", error);
  }
};

/**
 * Helper function to remove password from user object
 * @param {Object} user - User object with password
 * @returns {Object} - User object without password
 */
const sanitizeUserData = (user) => {
  if (!user) return null;

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Get user's primary cabang ID
 * @param {Object} user - User object with userCabang relation
 * @returns {string|null} - Primary cabang ID or first cabang ID or null
 */
const getUserPrimaryCabangId = (user) => {
  if (!user || !user.userCabang || user.userCabang.length === 0) {
    return null;
  }

  // Try to find primary cabang
  const primaryCabang = user.userCabang.find((uc) => uc.isPrimary);
  if (primaryCabang) {
    return primaryCabang.cabangId;
  }

  // If no primary cabang, return the first one
  return user.userCabang[0].cabangId;
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  resetPassword,
  forceLogout,
  getUserActivityLogs,
  uploadUserAvatar,
  deleteUserAvatar,
  invalidateUserCache,
};
