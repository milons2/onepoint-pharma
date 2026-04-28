const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Expiry alert (next X days)
async function expiryAlert(days = 30) {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);

  return prisma.batch.findMany({
    where: {
      expiryDate: {
        gte: today,
        lte: future
      }
    },
    include: {
      medicine: true
    }
  });
}

// Low stock alert
async function lowStockAlert(threshold = 10) {
  return prisma.batch.findMany({
    where: {
      quantity: { lte: threshold }
    },
    include: {
      medicine: true
    }
  });
}

module.exports = { expiryAlert, lowStockAlert };