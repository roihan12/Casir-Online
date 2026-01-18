const userAvatarService = require("../services/userAvatarService");

/**
 * Controller untuk upload avatar user
 */
const uploadAvatar = async (req, res) => {
  try {
    // Pastikan ada file yang diupload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Cek jika file adalah gambar
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    // Dapat userId dari params atau dari user yang login (jika update avatar sendiri)
    const userId = req.params.id || req.user.id;

    // Upload avatar
    const updatedUser = await userAvatarService.uploadUserAvatar(
      userId,
      req.file,
      {
        userId: req.user.id,
        ipAddress: req.ip,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl: updatedUser.avatarUrl,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to upload avatar",
    });
  }
};

/**
 * Controller untuk menghapus avatar user
 */
const deleteAvatar = async (req, res) => {
  try {
    // Dapat userId dari params atau dari user yang login (jika hapus avatar sendiri)
    const userId = req.params.id || req.user.id;

    // Hapus avatar
    const updatedUser = await userAvatarService.deleteUserAvatar(userId, {
      userId: req.user.id,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: "Avatar deleted successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error deleting avatar:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to delete avatar",
    });
  }
};

module.exports = {
  uploadAvatar,
  deleteAvatar,
};
