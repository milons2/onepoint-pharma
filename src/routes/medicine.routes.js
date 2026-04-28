const express = require("express");
const router = express.Router();

const { authMiddleware, requireRole } = require("../middleware/auth.middleware");

const {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  getInventoryAdvanced,
  searchMedicines
} = require("../services/medicine.service");

/* =========================
   SEARCH MEDICINES (POS)
========================= */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const q = req.query.q || "";
    const medicines = await searchMedicines(q);
    res.json({ success: true, data: medicines });
  } catch (err) {
    console.error("Medicine search error:", err);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

/* =========================
   GET ALL MEDICINES
========================= */
router.get(
  "/",
  authMiddleware,
  requireRole(["OWNER", "ADMIN", "PHARMACIST"]),
  async (req, res) => {
    try {
      const medicines = await getAllMedicines();
      res.json({ success: true, medicines });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

/* =========================
   CREATE MEDICINE
========================= */
router.post(
  "/",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      const medicine = await createMedicine(req.body);
      res.json({ success: true, medicine });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

/* =========================
   UPDATE MEDICINE
========================= */
router.put(
  "/:id",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      const medicine = await updateMedicine(req.params.id, req.body);
      res.json({ success: true, medicine });
    } catch (err) {
      res.status(400).json({ success: false, message: "Update failed" });
    }
  }
);

/* =========================
   DEACTIVATE MEDICINE
========================= */
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["OWNER"]),
  async (req, res) => {
    await deactivateMedicine(req.params.id);
    res.json({ success: true });
  }
);

/* =========================
   INVENTORY ADVANCED
========================= */
router.get(
  "/inventory/advanced",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      const inventory = await getInventoryAdvanced();
      res.json({ success: true, inventory });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
