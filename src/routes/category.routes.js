const express = require('express');
const router = express.Router();

const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET all categories
 */
router.get(
  '/',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    const categories = await prisma.category.findMany();
    res.json({ success: true, categories });
  }
);

/**
 * CREATE category
 */
router.post(
  '/',
  authMiddleware,
  requireRole(['OWNER', 'ADMIN']),
  async (req, res) => {
    const category = await prisma.category.create({
      data: {
        name: req.body.name
      }
    });
    res.json({ success: true, category });
  }
);

module.exports = router;
