const router = require("express").Router();

const {
  authMiddleware,
  requireRole
} = require("../middleware/auth.middleware");

const {
  createInvoice
} = require("../controllers/billing.controller");

// ADMIN + PHARMACIST CAN CREATE INVOICE  
router.post(
  "/create",
  authMiddleware,
  requireRole(["ADMIN", "PHARMACIST"]),
  createInvoice
);

module.exports = router;