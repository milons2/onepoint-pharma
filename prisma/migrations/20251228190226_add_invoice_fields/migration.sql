/*
  Warnings:

  - You are about to drop the column `price` on the `InvoiceItem` table. All the data in the column will be lost.
  - Added the required column `customerName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profit` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyPrice` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellPrice` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "profit" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "price",
ADD COLUMN     "buyPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "sellPrice" DOUBLE PRECISION NOT NULL;

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceItem_batchId_idx" ON "InvoiceItem"("batchId");
