const express = require("express");
const router = express.Router();

const { authMiddleware, requireRole } = require("../middleware/auth.middleware");
const { getInventoryAlerts } = require("../services/alert.service");

router.get(
  "/inventory",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      const alerts = await getInventoryAlerts();
      res.json({ success: true, alerts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
