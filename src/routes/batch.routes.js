const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const {
  getBatchesByMedicine,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch
} = require('../services/batch.service');

// Get batches for a medicine
router.get(
  '/medicine/:medicineId',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN', 'PHARMACIST']),
  async (req, res) => {
    try {
      const batches = await getBatchesByMedicine(req.params.medicineId);
      res.json({ success: true, batches });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Get single batch
router.get(
  '/:id',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const batch = await getBatchById(req.params.id);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      res.json({ success: true, batch });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// Create batch
router.post(
  '/',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const batch = await createBatch(req.body);
      res.json({ success: true, batch });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// Update batch
router.put(
  '/:id',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    try {
      const batch = await updateBatch(req.params.id, req.body);
      res.json({ success: true, batch });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

// Delete batch
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['OWNER']), // stricter
  async (req, res) => {
    try {
      await deleteBatch(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
