const express = require("express");
const router = express.Router();
const operationalHoursController = require("../controllers/operationalHoursController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const {authenticate} = require("../middleware/authMiddleware");

router.use(authenticate);

router.get(
  "/:cabangId",
  hasPermission(["settings:read"], { checkBranch: true }),
  operationalHoursController.getOperationalHours
);

router.put(
  "/:cabangId",
  hasPermission(["settings:manage"], { checkBranch: true }),
  operationalHoursController.updateOperationalHours
);

module.exports = router;
