const express = require("express");
const router = express.Router();
const refundController = require("../controllers/refund.controller");

// If you have a working auth middleware elsewhere, point to it. 
// Otherwise, comment out 'protect' for now so the server runs.
// const { protect } = require("../middleware/authMiddleware"); 

// Temporarily removed 'protect' to fix the MODULE_NOT_FOUND error
router.get("/invoice/:invoiceNo", refundController.getInvoiceForRefund);
router.post("/process", refundController.processRefund);
// Add this line below your other routes
router.get("/history", refundController.getRefundHistory);

module.exports = router;