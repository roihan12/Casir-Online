const userNotificationService = require("../services/userNotificationService");

const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isRead, page = 1, limit = 10 } = req.query;

    const filters = {
      isRead: isRead !== undefined ? (isRead === "true" || isRead === true) : undefined,
      page: Number(page),
      limit: Number(limit)
    };

    const result = await userNotificationService.getUserNotifications(userId, filters);

    res.status(200).json({
      success: true,
      data: result.data,
      unreadCount: result.unreadCount,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await userNotificationService.markAsRead(userId, id);

    res.status(200).json({
      success: true,
      message: "Notifikasi berhasil ditandai telah dibaca",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await userNotificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "Semua notifikasi berhasil ditandai telah dibaca"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead
};
