const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sellMedicine(medicineId, quantity) {
  const today = new Date();

  const batches = await prisma.batch.findMany({
    where: {
      medicineId,
      expiryDate: { gt: today },
      quantity: { gt: 0 }
    },
    orderBy: { expiryDate: 'asc' }
  });

  if (batches.length === 0) {
    throw new Error('No valid stock available');
  }

  let remaining = quantity;
  const usedBatches = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const usedQty = Math.min(batch.quantity, remaining);

    await prisma.batch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - usedQty }
    });

    usedBatches.push({
      batchId: batch.id,
      quantity: usedQty,
      buyPrice: batch.buyPrice,
      sellPrice: batch.sellPrice
    });

    remaining -= usedQty;
  }

  if (remaining > 0) {
    throw new Error('Insufficient stock');
  }

  return usedBatches;
}

module.exports = { sellMedicine };