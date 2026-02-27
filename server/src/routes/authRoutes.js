const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { upload, handleMulterUpload } = require("../middleware/uploadMiddleware");

router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);
router.put("/profile/avatar", authenticate, handleMulterUpload(upload.single("avatar")), authController.updateProfileWithAvatar);

module.exports = router;
