const userService = require("../services/userService");
const { ResponseError } = require("../error/responseError");

const getAllUsers = async (req, res, next) => {
  try {
    const { search, roleId, cabangId, status, page, limit } = req.query;

    const result = await userService.getAllUsers({
      search,
      roleId,
      cabangId,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return next(new ResponseError(404, "User not found"));
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const avatarFile = req.file; // Get uploaded file if exists

    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
      createdBy: req.user.namaLengkap,
    };

    // Create user first
    const newUser = await userService.createUser(userData, auditInfo);

    // If avatar file was uploaded, update the user with the avatar
    if (avatarFile) {
      await userService.uploadUserAvatar(newUser.id, avatarFile, auditInfo);

      // Get updated user data with avatar
      const updatedUser = await userService.getUserById(newUser.id);

      return res.status(201).json({
        success: true,
        message: "User created successfully with avatar",
        data: updatedUser,
      });
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    // Handle avatar file if it exists
    const avatar = req.file || null;

    const updatedUser = await userService.updateUser(
      id,
      userData,
      auditInfo,
      avatar
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    await userService.deleteUser(id, auditInfo);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const changeUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const statusData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedUser = await userService.changeUserStatus(
      id,
      statusData,
      auditInfo
    );

    return res.status(200).json({
      success: true,
      message: `User ${
        statusData.status === "aktif" ? "activated" : "deactivated"
      } successfully`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const passwordData = req.body;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    await userService.resetPassword(id, passwordData, auditInfo);

    return res.status(200).json({
      success: true,
      message: "User password reset successfully",
    });
  } catch (error) {
    next(error);
  }
};

const forceUserLogout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const result = await userService.forceLogout(id, auditInfo);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 */
const uploadUserAvatar = async (req, res, next) => {
  try {
    // Check if a file was uploaded
    if (!req.file) {
      return next(new ResponseError(400, "No avatar file uploaded"));
    }

    const { id } = req.params;
    const fileData = req.file;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedUser = await userService.uploadUserAvatar(
      id,
      fileData,
      auditInfo
    );

    return res.status(200).json({
      success: true,
      message: "User avatar uploaded successfully",
      data: {
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user avatar
 */
const deleteUserAvatar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const auditInfo = {
      userId: req.user.id,
      ipAddress: req.ip,
    };

    const updatedUser = await userService.deleteUserAvatar(id, auditInfo);

    return res.status(200).json({
      success: true,
      message: "User avatar deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getUserActivityLogs = async (req, res, next) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      action,
      tableName,
      ipAddress,
      page,
      limit,
    } = req.query;



    
    const filters = {
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      action,
      tableName,
      ipAddress,
      page,
      limit,
    };

    const result = await userService.getUserActivityLogs(filters);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const invalidateCache = async (req, res, next) => {
  try {
    await userService.invalidateUserCache(req.params.id || "*");

    return res.status(200).json({
      success: true,
      message: "Cache invalidated successfully",
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  resetUserPassword,
  forceUserLogout,
  uploadUserAvatar,
  deleteUserAvatar,
  getUserActivityLogs,
  invalidateCache,
};
