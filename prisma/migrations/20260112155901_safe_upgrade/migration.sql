-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'CARD', 'MOBILE');

-- DropIndex
DROP INDEX "Medicine_name_idx";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "invoiceNo" TEXT,
ADD COLUMN     "paymentType" "PaymentType" DEFAULT 'CASH',
ADD COLUMN     "staffId" INTEGER,
ADD COLUMN     "subtotal" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Medicine" ADD COLUMN     "totalStock" INTEGER DEFAULT 0;
