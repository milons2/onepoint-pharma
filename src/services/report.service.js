const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function salesReport(type = 'daily') {
  const now = new Date();
  let from;

  if (type === 'daily') {
    from = new Date(now.setHours(0, 0, 0, 0));
  } else if (type === 'weekly') {
    from = new Date();
    from.setDate(from.getDate() - 7);
  } else if (type === 'monthly') {
    from = new Date();
    from.setMonth(from.getMonth() - 1);
  }

  const result = await prisma.invoice.aggregate({
    _sum: {
      total: true,
      profit: true
    },
    where: {
      createdAt: {
        gte: from
      }
    }
  });

  return {
    period: type,
    totalSales: result._sum.total || 0,
    totalProfit: result._sum.profit || 0
  };
}

module.exports = { salesReport };