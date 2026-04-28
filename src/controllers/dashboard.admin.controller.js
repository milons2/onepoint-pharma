const prisma = require("../config/prisma");

/**
 * GET /api/dashboard/admin
 * Optimized for OnePoint Pharma Admin: Matches Owner Logic for Refund Impact
 */
exports.adminDashboard = async (req, res) => {
  try {
    /* ---------- 1. TIMEZONE & DATE LOGIC (DHAKA SYNC) ---------- */
    // Synchronized with your working Owner panel logic
    const dhakaStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
    const startOfToday = new Date(`${dhakaStr}T00:00:00.000+06:00`);
    const endOfToday = new Date(`${dhakaStr}T23:59:59.999+06:00`);

    // Define "Expiring Soon" (Next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(new Date().getDate() + 30);

    /* ---------- 2. PARALLEL QUERIES ---------- */
    const [
      todayInvoiceAgg,
      allRefundsToday,
      totalRevenueAgg,
      allRefundsLifetime,
      lowStockBatches,
      expiringBatches,
      expiredBatches
    ] = await Promise.all([
      // Today's Gross Invoices
      prisma.invoice.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfToday, lte: endOfToday } }
      }),

      // Today's Refunds (to calculate impact)
      prisma.refund.findMany({
        where: { createdAt: { gte: startOfToday, lte: endOfToday } }
      }),

      // Lifetime Gross Invoices
      prisma.invoice.aggregate({
        _sum: { total: true }
      }),

      // Lifetime Refunds
      prisma.refund.aggregate({
        _sum: { refundAmount: true }
      }),

      // Inventory: Low Stock
      prisma.batch.findMany({
        where: { quantity: { lte: 10, gt: 0 } },
        include: { medicine: { select: { id: true, name: true } } },
        orderBy: { quantity: 'asc' }
      }),

      // Inventory: Expiring Soon
      prisma.batch.findMany({
        where: {
          expiryDate: { gt: new Date(), lte: thirtyDaysFromNow },
          quantity: { gt: 0 }
        },
        include: { medicine: { select: { id: true, name: true } } },
        orderBy: { expiryDate: 'asc' }
      }),

      // Inventory: Expired
      prisma.batch.findMany({
        where: {
          expiryDate: { lte: new Date() },
          quantity: { gt: 0 }
        },
        include: { medicine: { select: { id: true, name: true } } },
        orderBy: { expiryDate: 'asc' }
      })
    ]);

    /* ---------- 3. CALCULATION LOGIC ---------- */
    
    // Calculate Today's Refund Total (Cash Out)
    const todayRefundCashOut = allRefundsToday.reduce(
      (sum, r) => sum + Number(r.refundAmount || 0), 
      0
    );

    // Final Net Calculations
    const netTodaySales = Math.max(0, Number(todayInvoiceAgg._sum.total || 0) - todayRefundCashOut);
    const netLifetimeRevenue = Number(totalRevenueAgg._sum.total || 0) - Number(allRefundsLifetime._sum.refundAmount || 0);

    /* ---------- 4. RESPONSE ---------- */
    res.status(200).json({
      success: true,
      // "todaySales" now correctly reflects Gross - Refunds for Dhaka Today
      todaySales: netTodaySales.toFixed(2), 
      totalLifetimeRevenue: netLifetimeRevenue.toFixed(2),
      
      lowStockCount: lowStockBatches.length,
      expiringSoonCount: expiringBatches.length,
      expiredCount: expiredBatches.length,
      
      alerts: {
        lowStock: lowStockBatches,
        expiringSoon: expiringBatches,
        expired: expiredBatches
      }
    });

  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "Could not sync admin data.",
      error: error.message 
    });
  }
};