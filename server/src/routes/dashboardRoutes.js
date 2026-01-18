const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");
const { cabangAccess } = require("../middleware/cabangMiddleware");

router.get(
  "/",
  authenticate,
  cabangAccess,
  dashboardController.getUserDashboard
);

router.get(
  "/active-shift/:cabangId",
  authenticate,
  dashboardController.getActiveShift
);

module.exports = router;
