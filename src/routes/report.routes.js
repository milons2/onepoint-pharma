const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get(
  '/owner-summary',
  authMiddleware,
  requireRole(['OWNER']),
  async (req, res) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todaySales = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: todayStart } }
    });

    const monthlyRevenue = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: monthStart } }
    });

    const profit = await prisma.invoice.aggregate({
      _sum: { profit: true }
    });

    const staffCount = await prisma.staff.count();

    res.json({
      success: true,
      data: {
        todaySales: todaySales._sum.total || 0,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        profit: profit._sum.profit || 0,
        staffCount
      }
    });
  }
);

module.exports = router;
