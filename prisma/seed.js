const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding OnePoint Pharma database...");

  // =========================
  // 1. OWNER (UPDATED CREDENTIALS)
  // =========================
  const passwordHash = await bcrypt.hash("makin0088", 10);

  await prisma.staff.upsert({
    where: { username: "ferdous_opp" },
    update: {
      name: "Ferdous Sarker",
      password: passwordHash,
      role: "OWNER",
    },
    create: {
      name: "Ferdous Sarker",
      username: "ferdous_opp",
      password: passwordHash,
      role: "OWNER",
    },
  });

  console.log("👤 Owner account (Ferdous Sarker) ensured");

  // =========================
  // 2. CATEGORIES (ADDED THERAPY & HOMEOPATHIC)
  // =========================
  const categories = [
    "Tablets",
    "Capsules",
    "Syrups & Suspensions",
    "Injections",
    "Eye Drops",
    "Creams & Ointments",
    "Antibiotics",
    "Pain Management",
    "Diabetes Care",
    "Cardiac Medicines",
    "Pediatric Medicines",
    "Vitamins & Supplements",
    "Surgical Instruments",
    "Bandages & Dressings",
    "Hospital Equipment",
    "Diagnostic Devices",
    "Antiseptics & Disinfectants",
    "Therapy Equipment",
    "Homeopathic"
  ];

  await prisma.category.createMany({
    data: categories.map(name => ({ name })),
    skipDuplicates: true,
  });

  console.log("📦 Categories seeded (including Therapy & Homeopathic)");

  // =========================
  // 3. SUPPLIERS (ADDED SPECIALIZED COMPANIES)
  // =========================
  const suppliers = [
    "Square Pharmaceuticals Ltd.",
    "Incepta Pharmaceuticals Ltd.",
    "Beximco Pharmaceuticals Ltd.",
    "Opsonin Pharma Ltd.",
    "Renata Limited",
    "ACI Limited",
    "Eskayef Pharmaceuticals Ltd.",
    "Drug International Ltd.",
    "Aristopharma Ltd.",
    "Beacon Pharmaceuticals Ltd.",
    "Healthcare Pharmaceuticals Ltd.",
    "Popular Pharmaceuticals Ltd.",
    "Ibn Sina Pharmaceutical Industry Ltd.",
    "ACME Laboratories Ltd.",
    "Orion Pharma Ltd.",
    "Ziska Pharmaceuticals Ltd.",
    "Delta Pharma Limited",
    "General Pharmaceuticals Ltd.",
    "Globe Pharmaceuticals Ltd.",
    "UniMed & UniHealth Pharmaceuticals Ltd.",
    "Navana Pharmaceuticals Ltd.",
    "NIPRO JMI Pharma Ltd.",
    "Julphar Bangladesh Ltd.",
    "Labaid Surgical & Equipment",
    "Technoworth Associates Ltd.",
    "Medimet Services",
    "Hahnemann Homeo Hall",
    "Dr. Reckeweg & Co. (Distributor)",
    "Schwabe Bangladesh",
    "SBL Homeopathy Ltd."
  ];

  await prisma.supplier.createMany({
    data: suppliers.map(name => ({ name })),
    skipDuplicates: true,
  });

  console.log("🏭 Suppliers seeded (Medicines + Equipment + Homeo)");

  // =========================
  // 4. DEMO MEDICINE + BATCH
  // =========================
  const antibioticCat = await prisma.category.findUnique({
    where: { name: "Antibiotics" },
  });

  const squareSupplier = await prisma.supplier.findFirst({
    where: { name: "Square Pharmaceuticals Ltd." },
  });

  if (antibioticCat && squareSupplier) {
    const medicine = await prisma.medicine.upsert({
      where: { barcode: "AMOX500" },
      update: {},
      create: {
        name: "Amoxicillin 500mg",
        barcode: "AMOX500",
        categoryId: antibioticCat.id,
        supplierId: squareSupplier.id,
      },
    });

    await prisma.batch.upsert({
      where: { 
        // Logic assuming batchNo is unique or using update if you have a unique constraint
        id: 1 
      },
      update: {},
      create: {
        medicineId: medicine.id,
        batchNo: "BATCH-001",
        expiryDate: new Date("2026-12-31"),
        buyPrice: 5,
        sellPrice: 8,
        quantity: 200,
      },
    });
    console.log("💊 Demo medicine & batch added");
  }

  console.log("✅ Seed completed successfully");
}

main()
  .catch(err => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });