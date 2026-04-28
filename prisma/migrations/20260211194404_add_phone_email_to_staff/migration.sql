/*
  Warnings:

  - The `paymentType` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `totalStock` on the `Medicine` table. All the data in the column will be lost.
  - Made the column `invoiceNo` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `staffId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subtotal` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "invoiceNo" SET NOT NULL,
DROP COLUMN "paymentType",
ADD COLUMN     "paymentType" TEXT DEFAULT 'CASH',
ALTER COLUMN "staffId" SET NOT NULL,
ALTER COLUMN "subtotal" SET NOT NULL;

-- AlterTable
ALTER TABLE "Medicine" DROP COLUMN "totalStock";

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropEnum
DROP TYPE "PaymentType";

-- CreateTable
CREATE TABLE "InvoiceSequence" (
    "year" INTEGER NOT NULL,
    "lastNo" INTEGER DEFAULT 0
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" SERIAL NOT NULL,
    "refundno" TEXT NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "staffId" INTEGER NOT NULL,
    "reason" TEXT,
    "refundType" TEXT NOT NULL,
    "refundAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundItem" (
    "id" SERIAL NOT NULL,
    "refundId" INTEGER NOT NULL,
    "invoiceItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "returnStock" BOOLEAN DEFAULT true,

    CONSTRAINT "RefundItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" INTEGER NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceSequence_year_key" ON "InvoiceSequence"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundno_key" ON "Refund"("refundno");

-- CreateIndex
CREATE INDEX "Medicine_name_idx" ON "Medicine"("name");

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "fk_refund_invoice" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "fk_refund_staff" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "fk_refunditem_invoiceitem" FOREIGN KEY ("invoiceItemId") REFERENCES "InvoiceItem"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RefundItem" ADD CONSTRAINT "fk_refunditem_refund" FOREIGN KEY ("refundId") REFERENCES "Refund"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
