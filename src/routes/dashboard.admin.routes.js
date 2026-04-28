const express = require("express");
const router = express.Router();
const prisma = require("../config/prisma");
const {
  authMiddleware,
  requireRole
} = require("../middleware/auth.middleware");

/*
=====================================================
 ADMIN DASHBOARD - PROFESSIONAL SYNC (FIXED REFUNDS)
=====================================================
 Access: ADMIN only
 Provides: Net Sales (Sales - Refunds) + Alerts
=====================================================
*/
router.get(
  "/admin",
  authMiddleware,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      /* ---------- 1. TIMEZONE & DATE LOGIC (ASIA/DHAKA) ---------- */
      // Get current date string in Dhaka (YYYY-MM-DD)
      const dhakaStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      
      // Force start/end of today to Dhaka midnight to match Owner Panel
      const startOfToday = new Date(`${dhakaStr}T00:00:00.000+06:00`);
      const endOfToday = new Date(`${dhakaStr}T23:59:59.999+06:00`);

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(new Date().getDate() + 30);

      /* ---------- 2. PARALLEL QUERIES ---------- */
      const [salesResult, refundResult, lowStock, expiringSoon, expired] = await Promise.all([
        // 1. Today's Gross Revenue
        prisma.invoice.aggregate({
          _sum: { total: true },
          where: { createdAt: { gte: startOfToday, lte: endOfToday } },
        }),

        // 2. Today's Total Refund Amount
        prisma.refund.aggregate({
          _sum: { refundAmount: true },
          where: { createdAt: { gte: startOfToday, lte: endOfToday } },
        }),

        // 3. Low Stock List (Items <= 10)
        prisma.batch.findMany({
          where: { quantity: { lte: 10, gt: 0 } },
          include: { medicine: { select: { id: true, name: true } } },
          orderBy: { quantity: 'asc' }
        }),

        // 4. Expiring Soon List (Next 30 days)
        prisma.batch.findMany({
          where: {
            expiryDate: { gt: new Date(), lte: thirtyDaysFromNow },
            quantity: { gt: 0 }
          },
          include: { medicine: { select: { id: true, name: true } } },
          orderBy: { expiryDate: 'asc' }
        }),

        // 5. Expired List
        prisma.batch.findMany({
          where: {
            expiryDate: { lte: new Date() },
            quantity: { gt: 0 }
          },
          include: { medicine: { select: { id: true, name: true } } },
          orderBy: { expiryDate: 'asc' }
        })
      ]);

      /* ---------- 3. NET REVENUE CALCULATION ---------- */
      const grossSales = Number(salesResult._sum.total || 0);
      const totalRefunds = Number(refundResult._sum.refundAmount || 0);
      
      // The math that was missing:
      const netTodaySales = Math.max(0, grossSales - totalRefunds);

      /* ---------- 4. RESPONSE ---------- */
      res.json({
        // This todaySales now correctly decreases after a refund
        todaySales: netTodaySales.toFixed(2),
        lowStockCount: lowStock.length,
        expiringSoonCount: expiringSoon.length,
        expiredCount: expired.length,
        alerts: {
          lowStock,
          expiringSoon,
          expired
        }
      });

    } catch (err) {
      console.error("Admin dashboard error:", err);
      res.status(500).json({ message: "Internal Server Error: Admin dashboard sync failed" });
    }
  }
);

module.exports = router;