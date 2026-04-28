const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const {
  authMiddleware,
  requireRole
} = require("../middleware/auth.middleware");

/* =========================
    OWNER DASHBOARD SUMMARY
========================= */
router.get(
  "/owner",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      /* ---------- 1. TIMEZONE & DATE LOGIC (DHAKA) ---------- */
      // Get current date string in Dhaka (YYYY-MM-DD)
      const dhakaStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
      
      // Force start/end of today to Dhaka midnight
      const startOfToday = new Date(`${dhakaStr}T00:00:00.000+06:00`);
      const endOfToday = new Date(`${dhakaStr}T23:59:59.999+06:00`);

      // Monthly calculation helpers
      const nowInDhaka = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
      const monthStart = new Date(nowInDhaka.getFullYear(), nowInDhaka.getMonth(), 1);
      const lastMonthStart = new Date(nowInDhaka.getFullYear(), nowInDhaka.getMonth() - 1, 1);

      /* ---------- 2. STOCK VALUE (INVESTMENT) ---------- */
      const batches = await prisma.batch.findMany({
        select: { buyPrice: true, quantity: true }
      });

      const totalInvestmentValue = batches.reduce(
        (sum, b) => sum + (Number(b.buyPrice || 0) * Number(b.quantity || 0)),
        0
      );

      /* ---------- 3. INVOICE AGGREGATIONS ---------- */
      const todayInvoiceAgg = await prisma.invoice.aggregate({
        _sum: { total: true, profit: true },
        where: { createdAt: { gte: startOfToday, lte: endOfToday } }
      });

      const monthInvoiceAgg = await prisma.invoice.aggregate({
        _sum: { total: true, profit: true },
        _count: { id: true },
        where: { createdAt: { gte: monthStart } }
      });

      const lastMonthInvoiceAgg = await prisma.invoice.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: lastMonthStart, lt: monthStart } }
      });

      const wholeProfitAgg = await prisma.invoice.aggregate({
        _sum: { profit: true }
      });

      /* ---------- 4. REFUND IMPACT LOGIC ---------- */
      const allRefunds = await prisma.refund.findMany({
        include: { 
          RefundItem: { include: { InvoiceItem: true } } 
        }
      });

      const calculateImpact = (refunds) => {
        let totalCashOut = 0;
        let lostProfit = 0;
        refunds.forEach(r => {
          totalCashOut += Number(r.refundAmount || 0);
          r.RefundItem.forEach(ri => {
            const sell = Number(ri.sellPrice || 0);
            const buy = Number(ri.InvoiceItem?.buyPrice || 0);
            lostProfit += (sell - buy) * ri.quantity;
          });
        });
        return { totalCashOut, lostProfit };
      };

      const todayImpact = calculateImpact(allRefunds.filter(r => r.createdAt >= startOfToday && r.createdAt <= endOfToday));
      const monthlyImpact = calculateImpact(allRefunds.filter(r => r.createdAt >= monthStart));
      const wholeImpact = calculateImpact(allRefunds);

      /* ---------- 5. FINAL MATH ---------- */
      // Today (Daily Reset)
      const netTodaySales = Math.max(0, Number(todayInvoiceAgg._sum.total || 0) - todayImpact.totalCashOut);
      const netTodayProfit = Number(todayInvoiceAgg._sum.profit || 0) - todayImpact.lostProfit;

      // Monthly
      const netMonthlyRevenue = Number(monthInvoiceAgg._sum.total || 0) - monthlyImpact.totalCashOut;
      const netMonthlyProfit = Number(monthInvoiceAgg._sum.profit || 0) - monthlyImpact.lostProfit;
      
      // All Time
      const wholeProfitAmount = Number(wholeProfitAgg._sum.profit || 0) - wholeImpact.lostProfit;

      // Growth
      const lastMonthTotal = Number(lastMonthInvoiceAgg._sum.total || 0);
      let monthlyGrowth = 0;
      if (lastMonthTotal > 0) {
        monthlyGrowth = (((netMonthlyRevenue - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1);
      } else if (netMonthlyRevenue > 0) {
        monthlyGrowth = 100;
      }

      /* ---------- 6. RESPONSE ---------- */
      res.json({
        stats: {
          // Investment Cards
          wholeInvestAmount: totalInvestmentValue.toFixed(2),
          totalInvestment: totalInvestmentValue.toFixed(2),
          stockValue: totalInvestmentValue.toFixed(2),
          
          // Sales & Profit (Daily Resetting)
          todaySales: netTodaySales.toFixed(2),
          todayProfit: netTodayProfit.toFixed(2), 
          netProfit: netTodayProfit.toFixed(2), // Standard card shows Today
          
          // Monthly Cards (New)
          monthlyRevenue: netMonthlyRevenue.toFixed(2),
          monthlyNetProfit: netMonthlyProfit.toFixed(2), // NEW CARD DATA
          
          // All Time
          wholeProfitAmount: wholeProfitAmount.toFixed(2),

          // Others
          avgOrderValue: monthInvoiceAgg._count.id > 0 ? (netMonthlyRevenue / monthInvoiceAgg._count.id).toFixed(2) : "0.00",
          monthlyGrowth: Number(monthlyGrowth),
          cashOnHand: netTodaySales.toFixed(2),
          liquidityScore: totalInvestmentValue > 0 ? ((netTodaySales / totalInvestmentValue) * 100).toFixed(1) : "0.00"
        }
      });
    } catch (err) {
      console.error("Owner dashboard error:", err);
      res.status(500).json({ message: "Dashboard load failed" });
    }
  }
);

/* =========================
    MARKET VALUATION HISTORY (INFINITY CHART)
========================= */
router.get(
  "/owner/weekly-chart",
  authMiddleware,
  requireRole(["OWNER", "ADMIN"]),
  async (req, res) => {
    try {
      // 1. Fetch all data needed for the chart
      const [allInvoices, allRefunds] = await Promise.all([
        prisma.invoice.findMany({
          select: { total: true, profit: true, createdAt: true }
        }),
        prisma.refund.findMany({
          include: { 
            RefundItem: { include: { InvoiceItem: { select: { buyPrice: true } } } } 
          }
        })
      ]);

      const historyMap = {};

      // Helper to get Dhaka Date Key (YYYY-MM-DD)
      const getDhakaKey = (date) => new Date(date).toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

      // 2. Group Invoices by Day
      allInvoices.forEach(inv => {
        const day = getDhakaKey(inv.createdAt);
        if (!historyMap[day]) historyMap[day] = { sales: 0, profit: 0 };
        historyMap[day].sales += Number(inv.total || 0);
        historyMap[day].profit += Number(inv.profit || 0);
      });

      // 3. Group Refunds by Day (Subtracted from the totals)
      allRefunds.forEach(ref => {
        const day = getDhakaKey(ref.createdAt);
        if (!historyMap[day]) historyMap[day] = { sales: 0, profit: 0 };
        
        // Subtract refund amount from sales
        historyMap[day].sales -= Number(ref.refundAmount || 0);
        
        // Subtract lost profit from profit
        ref.RefundItem.forEach(ri => {
          const sell = Number(ri.sellPrice || 0);
          const buy = Number(ri.InvoiceItem?.buyPrice || 0);
          historyMap[day].profit -= (sell - buy) * Number(ri.quantity || 0);
        });
      });

      // 4. Format for Frontend
      const chartData = Object.keys(historyMap).sort().map(day => ({
        day,
        sales: Math.max(0, historyMap[day].sales), // Ensure sales aren't negative for the bar chart
        profit: historyMap[day].profit
      }));

      res.json({ data: chartData });
    } catch (err) {
      console.error("Market history error:", err);
      res.status(500).json({ message: "Market data load failed" });
    }
  }
);

module.exports = router;