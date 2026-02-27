const prisma = require("../config/db");
const { ResponseError } = require("../error/responseError");

/**
 * Get user non-stock notifications (HR/Personal)
 */
const getUserNotifications = async (userId, filters = {}) => {
  const { isRead, page = 1, limit = 10 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    user_id: userId,
    ...(isRead !== undefined && { is_read: isRead })
  };

  const [notifications, total] = await Promise.all([
    prisma.notifikasi.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: Number(limit)
    }),
    prisma.notifikasi.count({ where })
  ]);

  const totalPages = Math.ceil(total / limit);
  const unreadCount = await prisma.notifikasi.count({
    where: { user_id: userId, is_read: false }
  });

  return {
    data: notifications,
    unreadCount,
    pagination: {
      total,
      totalPages,
      currentPage: Number(page),
      limit: Number(limit)
    }
  };
};

/**
 * Mark a specific user notification as read
 */
const markAsRead = async (userId, notificationId) => {
  const notification = await prisma.notifikasi.findUnique({
    where: { notif_id: notificationId }
  });

  if (!notification) {
    throw new ResponseError(404, "Notifikasi tidak ditemukan");
  }

  if (notification.user_id !== userId) {
    throw new ResponseError(403, "Tidak memiliki akses ke notifikasi ini");
  }

  return await prisma.notifikasi.update({
    where: { notif_id: notificationId },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
};

/**
 * Mark all user notifications as read
 */
const markAllAsRead = async (userId) => {
  return await prisma.notifikasi.updateMany({
    where: {
      user_id: userId,
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  });
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
