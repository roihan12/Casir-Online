const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");
const {
  uploadFileToSupabase,
  deleteFilesFromSupabase,
} = require("../utils/uploadToSupabase");
const { createAuditLog } = require("../utils/auditLog");
const path = require("path");
const { supabase, bucketName } = require("../config/supabase");
const { cacheDelete, createCacheKey } = require("../utils/redisUtils");
const { logger } = require("../utils/logger");


// Cache key constants (copied from userService)
const CACHE_KEYS = {
  USER_LIST: "user:list",
  USER_DETAIL: "user:detail",
  USER_ACTIVITY: "user:activity",
};

/**
 * Invalidate user cache for avatar changes
 * @param {string} userId - User ID
 */
const invalidateUserCache = async (userId) => {
  try {
    // Delete specific user cache
    await cacheDelete(createCacheKey(CACHE_KEYS.USER_DETAIL, userId));
    // Delete all list caches that might contain this user
    await cacheDelete(CACHE_KEYS.USER_LIST + "*");
  } catch (error) {
    logger.error("Error invalidating user cache:", error);
  }
};

/**
 * Upload avatar untuk user dan update data di database
 * @param {string} userId - ID user
 * @param {object} file - File avatar yang diupload (dari multer)
 * @param {object} context - Informasi audit
 * @returns {object} User yang sudah diupdate
 */
const uploadUserAvatar = async (userId, file, context, cabangId) => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  try {
    // Modifikasi path untuk avatars
    const timestamp = Date.now();
    // const fileExt = path.extname(file.originalname);
    const fileName = `${timestamp}-${file.originalname.replace(/\s+/g, "-")}`;
    const filePath = `avatars/${userId}/${fileName}`;

    // Upload ke Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      throw new ResponseError(400, `Error uploading avatar: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    // Delete old avatar if exists
    if (user.avatarUrl) {
      try {
        // Ekstrak path file dari URL lengkap
        const oldAvatarUrl = new URL(user.avatarUrl);
        const oldPathParts = oldAvatarUrl.pathname.split("/");
        const bucketIndex = oldPathParts.findIndex(
          (part) => part === bucketName
        );

        if (bucketIndex !== -1 && bucketIndex < oldPathParts.length - 1) {
          const oldAvatarPath = oldPathParts.slice(bucketIndex + 1).join("/");
          await deleteFilesFromSupabase([oldAvatarPath]);
        }
      } catch (error) {
        logger.error("Error deleting old avatar:", error);
        // Lanjutkan proses meskipun gagal menghapus avatar lama
      }
    }

    // Update user data di database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: urlData.publicUrl,
      },
    });

    // Buat audit log
    await createAuditLog(prisma, {
      userId: context.userId,
      ipAddress: context.ipAddress,
      cabangId: cabangId,
      action: "UPDATE",
      tableName: "user",
      recordId: userId,
      oldValues: { avatarUrl: user.avatarUrl },
      newValues: { avatarUrl: urlData.publicUrl },
    });

    // Invalidate cache
    await invalidateUserCache(userId);

    // Return user tanpa password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    if (error instanceof ResponseError) {
      throw error;
    }
    throw new ResponseError(500, `Failed to upload avatar: ${error.message}`);
  }
};

/**
 * Menghapus avatar user
 * @param {string} userId - ID user
 * @param {object} context - Informasi audit
 * @returns {object} User yang sudah diupdate
 */
const deleteUserAvatar = async (userId, context, cabangId) => {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ResponseError(404, "User not found");
  }

  if (!user.avatarUrl) {
    throw new ResponseError(400, "User does not have an avatar");
  }

  try {
    // Ekstrak path file dari URL lengkap
    try {
      const avatarUrl = new URL(user.avatarUrl);
      const pathParts = avatarUrl.pathname.split("/");
      const bucketIndex = pathParts.findIndex((part) => part === bucketName);

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        const avatarPath = pathParts.slice(bucketIndex + 1).join("/");
        // Delete dari Supabase
        await deleteFilesFromSupabase([avatarPath]);
      }
    } catch (error) {
      logger.error("Error parsing avatar URL:", error);
    }

    // Update user data di database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
      },
    });

    // Buat audit log
    await createAuditLog(prisma, {
      userId: context.userId,
      ipAddress: context.ipAddress,
      cabangId: cabangId,
      action: "UPDATE",
      tableName: "user",
      recordId: userId,
      oldValues: { avatarUrl: user.avatarUrl },
      newValues: { avatarUrl: null },
    });

    // Invalidate cache
    await invalidateUserCache(userId);

    // Return user tanpa password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    throw new ResponseError(500, `Failed to delete avatar: ${error.message}`);
  }
};

module.exports = {
  uploadUserAvatar,
  deleteUserAvatar,
};
