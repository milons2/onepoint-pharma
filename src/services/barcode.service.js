const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findByBarcode(barcode) {
  return prisma.medicine.findUnique({
    where: { barcode },
    include: {
      batches: {
        where: { quantity: { gt: 0 } },
        orderBy: { expiryDate: 'asc' }
      }
    }
  });
}

module.exports = { findByBarcode };