const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all batches for a medicine (ordered by expiry)
 */
async function getBatchesByMedicine(medicineId) {
  return prisma.batch.findMany({
    where: { medicineId: Number(medicineId) },
    orderBy: { expiryDate: 'asc' }
  });
}

/**
 * Get single batch (used for edit / validation)
 */
async function getBatchById(id) {
  return prisma.batch.findUnique({
    where: { id: Number(id) },
    include: { medicine: true }
  });
}

/**
 * Create new batch (stock-in)
 */
async function createBatch(data) {
  if (Number(data.quantity) < 0) {
    throw new Error('Quantity cannot be negative');
  }

  return prisma.batch.create({
    data: {
      medicineId: Number(data.medicineId),
      batchNo: data.batchNo,
      expiryDate: new Date(data.expiryDate),
      buyPrice: Number(data.buyPrice),
      sellPrice: Number(data.sellPrice),
      quantity: Number(data.quantity)
    }
  });
}

/**
 * Update batch (price / quantity correction)
 */
async function updateBatch(id, data) {
  const existing = await getBatchById(id);
  if (!existing) throw new Error('Batch not found');

  if (data.quantity !== undefined && Number(data.quantity) < 0) {
    throw new Error('Quantity cannot be negative');
  }

  return prisma.batch.update({
    where: { id: Number(id) },
    data: {
      batchNo: data.batchNo ?? undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      buyPrice: data.buyPrice !== undefined ? Number(data.buyPrice) : undefined,
      sellPrice: data.sellPrice !== undefined ? Number(data.sellPrice) : undefined,
      quantity: data.quantity !== undefined ? Number(data.quantity) : undefined
    }
  });
}

/**
 * Delete batch (ADMIN only, future: soft delete)
 */
async function deleteBatch(id) {
  const existing = await getBatchById(id);
  if (!existing) throw new Error('Batch not found');

  return prisma.batch.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  getBatchesByMedicine,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch
};