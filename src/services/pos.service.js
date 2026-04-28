const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createInvoice } = require('./invoice.service');

async function quickSell(customerName, medicineId, quantity) {

  const batch = await prisma.batch.findFirst({
    where: {
      medicineId,
      quantity: { gte: quantity },
      expiryDate: { gt: new Date() }
    },
    orderBy: { expiryDate: 'asc' }
  });

  if (!batch) {
    throw new Error('No valid stock available');
  }

  return createInvoice(customerName, batch.id, quantity);
}

module.exports = { quickSell };