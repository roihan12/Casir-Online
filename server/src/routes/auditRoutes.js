const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { hasPermission } = require("../middleware/permissionMiddleware");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);

router.get("/", hasPermission(["audit:read"]), auditController.getAuditLogs);
router.get("/export", hasPermission(["audit:read"]), auditController.exportAuditLogs);
router.get("/:logId", hasPermission(["audit:read"]), auditController.getAuditLogDetail);

module.exports = router;
