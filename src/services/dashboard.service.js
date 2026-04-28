const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =========================
   OWNER DASHBOARD SUMMARY
========================= */
async function getOwnerDashboard() {
  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  /* ---------- 1. WHOLE INVESTMENT (STOCK VALUE) ---------- */
  const batches = await prisma.batch.findMany({
    select: { buyPrice: true, quantity: true }
  });

  const wholeInvestAmount = batches.reduce(
    (sum, b) => sum + (Number(b.buyPrice || 0) * Number(b.quantity || 0)),
    0
  );

  /* ---------- 2. REFUND IMPACT LOGIC (ALL TIME) ---------- */
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

  const wholeImpact = calculateImpact(allRefunds);
  const monthlyImpact = calculateImpact(allRefunds.filter(r => r.createdAt >= monthStart));
  const todayImpact = calculateImpact(allRefunds.filter(r => r.createdAt >= startOfToday));

  /* ---------- 3. INVOICE AGGREGATIONS ---------- */
  const wholeProfitAgg = await prisma.invoice.aggregate({ _sum: { profit: true } });
  
  const todayAgg = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: { createdAt: { gte: startOfToday } }
  });

  const monthlyAgg = await prisma.invoice.aggregate({
    _sum: { total: true, profit: true },
    where: { createdAt: { gte: monthStart } }
  });

  return {
    wholeInvestAmount,
    wholeProfitAmount: (Number(wholeProfitAgg._sum.profit || 0) - wholeImpact.lostProfit),
    todaySales: (Number(todayAgg._sum.total || 0) - todayImpact.totalCashOut),
    monthlyRevenue: (Number(monthlyAgg._sum.total || 0) - monthlyImpact.totalCashOut),
    netProfit: (Number(monthlyAgg._sum.profit || 0) - monthlyImpact.lostProfit)
  };
}

/* =========================
   MARKET VALUATION HISTORY (ALL TIME)
========================= */
async function getMarketValuationHistory() {
  // Removed the "7 days" interval to show all-time data
  const rows = await prisma.$queryRaw`
    WITH invoice_data AS (
      SELECT 
        DATE(timezone('Asia/Dhaka', "createdAt")) AS day, 
        SUM(total) AS sales, 
        SUM(profit) AS gross_profit
      FROM "Invoice"
      GROUP BY 1
    ),
    refund_impact AS (
      SELECT 
        DATE(timezone('Asia/Dhaka', r."createdAt")) AS day, 
        SUM(r."refundAmount") AS total_refund_cash,
        SUM((ri."sellPrice" - ii."buyPrice") * ri."quantity") AS lost_profit
      FROM "Refund" r
      JOIN "RefundItem" ri ON r."id" = ri."refundId"
      JOIN "InvoiceItem" ii ON ri."invoiceItemId" = ii."id"
      GROUP BY 1
    )
    SELECT 
      COALESCE(i.day, ref.day)::text as day,
      COALESCE(i.sales, 0) - COALESCE(ref.total_refund_cash, 0) AS sales,
      COALESCE(i.gross_profit, 0) - COALESCE(ref.lost_profit, 0) AS profit
    FROM invoice_data i
    FULL OUTER JOIN refund_impact ref ON i.day = ref.day
    ORDER BY 1 ASC;
  `;

  return rows.map(r => ({
    day: r.day,
    sales: parseFloat(r.sales || 0),
    profit: parseFloat(r.profit || 0)
  }));
}

module.exports = {
  getOwnerDashboard,
  getMarketValuationHistory // Renamed for clarity
};