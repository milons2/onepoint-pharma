const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getDailySummary = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 1. Fetch Invoices for today
    const invoices = await prisma.invoice.findMany({
      where: { 
        createdAt: { gte: startOfDay } 
      },
      select: { 
        total: true, 
        paymentType: true 
      }
    });

    // 2. Fetch Refunds (Correctly joining with Invoice table for paymentType)
    const refunds = await prisma.refund.findMany({
      where: { 
        createdAt: { gte: startOfDay } 
      },
      select: {
        refundAmount: true,
        Invoice: { 
          select: { paymentType: true } 
        }
      }
    });

    let grossSales = 0;
    let cashSales = 0;
    let bkashSales = 0; // NEW
    let cardSales = 0;
    let refundTotal = 0;
    let refundCash = 0;
    let refundBkash = 0; // NEW
    let refundCard = 0;

    // Calculate Sales
    invoices.forEach(inv => {
      const amount = Number(inv.total || 0);
      const type = (inv.paymentType || "CASH").toUpperCase();
      grossSales += amount;
      if (type === "CASH") cashSales += amount;
      if (type === "BKASH") bkashSales += amount; // NEW
      if (type === "CARD") cardSales += amount;
    });

    // Calculate Refunds
    refunds.forEach(ref => {
      const amount = Number(ref.refundAmount || 0);
      const type = (ref.Invoice?.paymentType || "CASH").toUpperCase();
      refundTotal += amount;
      if (type === "CASH") refundCash += amount;
      if (type === "BKASH") refundBkash += amount; // NEW
      if (type === "CARD") refundCard += amount;
    });

    res.json({
      success: true,
      data: {
        grossSales,
        refundTotal,
        netSales: grossSales - refundTotal,
        totalInvoices: invoices.length,
        cashSales: cashSales - refundCash,
        bkashSales: bkashSales - refundBkash, // NEW
        cardSales: cardSales - refundCard
      }
    });
  } catch (error) {
    console.error("❌ Daily Summary Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

module.exports = {
  getDailySummary
};