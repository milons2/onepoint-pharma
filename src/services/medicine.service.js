const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/* =========================
   GET ALL MEDICINES
========================= */
async function getAllMedicines() {
  return prisma.medicine.findMany({
    where: { isActive: true },
    include: {
      category: true,
      supplier: true,
      batches: true
    }
  });
}

/* =========================
   CREATE MEDICINE (SAFE)
========================= */
async function createMedicine(data) {
  const category = await prisma.category.findUnique({
    where: { id: Number(data.categoryId) }
  });
  if (!category) throw new Error("Category not found");

  const supplier = await prisma.supplier.findUnique({
    where: { id: Number(data.supplierId) }
  });
  if (!supplier) throw new Error("Supplier not found");

  return prisma.medicine.create({
    data: {
      name: data.name,
      categoryId: Number(data.categoryId),
      supplierId: Number(data.supplierId),
      barcode: data.barcode || null,
      isActive: true
    }
  });
}

/* =========================
   UPDATE MEDICINE
========================= */
async function updateMedicine(id, data) {
  return prisma.medicine.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      categoryId: Number(data.categoryId),
      supplierId: Number(data.supplierId),
      barcode: data.barcode || null
    }
  });
}

/* =========================
   SOFT DELETE MEDICINE
========================= */
async function deactivateMedicine(id) {
  return prisma.medicine.update({
    where: { id: Number(id) },
    data: { isActive: false }
  });
}

/* =========================
   SEARCH MEDICINE (POS + INVENTORY READ ONLY)
   🔧 FIXED: category included
========================= */
async function searchMedicines(query) {
  return prisma.medicine.findMany({
    where: {
      isActive: true,
      name: {
        contains: query,
        mode: "insensitive"
      }
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      batches: {
        where: {
          quantity: { gt: 0 }
        },
        orderBy: {
          expiryDate: "asc"
        }
      }
    }
  });
}

/* =========================
   INVENTORY ADVANCED
========================= */
async function getInventoryAdvanced() {
  const medicines = await prisma.medicine.findMany({
    where: { isActive: true },
    include: {
      category: true,
      supplier: true,
      batches: true
    }
  });

  const today = new Date();
  const nearExpiryDate = new Date();
  nearExpiryDate.setDate(today.getDate() + 90);

  return medicines.map((m) => {
    const totalStock = m.batches.reduce(
      (sum, b) => sum + b.quantity,
      0
    );

    const expiredBatches = m.batches.filter(
      (b) => new Date(b.expiryDate) < today
    );

    const nearExpiryBatches = m.batches.filter(
      (b) =>
        new Date(b.expiryDate) >= today &&
        new Date(b.expiryDate) <= nearExpiryDate
    );

    return {
      ...m,
      totalStock,
      isLowStock: totalStock <= 20,
      expiredCount: expiredBatches.length,
      nearExpiryCount: nearExpiryBatches.length
    };
  });
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  getAllMedicines,
  createMedicine,
  updateMedicine,
  deactivateMedicine,
  getInventoryAdvanced,
  searchMedicines
};
