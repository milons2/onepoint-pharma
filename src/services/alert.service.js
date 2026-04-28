const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function getInventoryAlerts() {
  const today = new Date();
  const soon = new Date();
  soon.setDate(today.getDate() + 30);

  // ---------- EXPIRY ALERTS ----------
  const batches = await prisma.batch.findMany({
    include: {
      medicine: { select: { name: true } }
    }
  });

  const expired = [];
  const expiringSoon = [];
  const lowStock = [];

  for (const b of batches) {
    if (new Date(b.expiryDate) < today) {
      expired.push(b);
    } else if (new Date(b.expiryDate) <= soon) {
      expiringSoon.push(b);
    }

    if (b.quantity <= 10) {
      lowStock.push(b);
    }
  }

  return {
    expired,
    expiringSoon,
    lowStock
  };
}

module.exports = { getInventoryAlerts };