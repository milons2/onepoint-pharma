const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth.middleware');

const {
  getAllStaff,
  updateStaff,
  deleteStaff
} = require('../services/staff.service');

/* GET ALL STAFF — OWNER ONLY */
router.get(
  '/',
  authMiddleware,
  requireRole(['OWNER']),
  async (req, res) => {
    const staff = await getAllStaff();
    res.json({ staff });
  }
);

/* UPDATE STAFF (ROLE / PASSWORD) — OWNER ONLY */
router.put(
  '/:id',
  authMiddleware,
  requireRole(['OWNER']),
  async (req, res) => {
    const id = Number(req.params.id);
    const staff = await updateStaff(id, req.body);
    res.json({ success: true, staff });
  }
);

/* DELETE STAFF — OWNER ONLY */
router.delete(
  '/:id',
  authMiddleware,
  requireRole(['OWNER']),
  async (req, res) => {
    const id = Number(req.params.id);
    await deleteStaff(id);
    res.json({ success: true });
  }
);

module.exports = router;