const express = require("express");
const { getDailySummary } = require("../controllers/pharmacistReport.controller");
const auth = require("../middleware/auth.middleware");

const { authMiddleware, requireRole } = auth;

const router = express.Router();

// Apply middleware to daily summary route
router.get(
  "/daily-summary",
  authMiddleware,
  requireRole(["PHARMACIST", "OWNER", "ADMIN"]),
  getDailySummary
);

module.exports = router;
