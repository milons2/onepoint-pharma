const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET all suppliers
 */
router.get(
  '/',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    const suppliers = await prisma.supplier.findMany();
    res.json({ success: true, suppliers });
  }
);

/**
 * CREATE supplier
 */
router.post(
  '/',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    const supplier = await prisma.supplier.create({
      data: {
        name: req.body.name
      }
    });
    res.json({ success: true, supplier });
  }
);

module.exports = router;
