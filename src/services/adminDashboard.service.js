const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getAdminOverview() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySales = await prisma.invoice.aggregate({
    _sum: { totalAmount: true },
    where: { createdAt: { gte: today } }
  });

  const lowStock = await prisma.batch.count({
    where: { quantity: { lte: 5 } }
  });

  const expiringSoon = await prisma.batch.count({
    where: {
      expiryDate: {
        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return {
    todaySales: todaySales._sum.totalAmount || 0,
    lowStock,
    expiringSoon
  };
}

module.exports = { getAdminOverview };
