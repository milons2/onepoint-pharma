const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const { authMiddleware, requireRole } = require("../middleware/auth.middleware");

router.post(
  "/checkout",
  authMiddleware,
  requireRole(["ADMIN", "PHARMACIST"]),
  async (req, res) => {
    try {
      const { customerName = "Walk-in", items, paymentType = "CASH" } = req.body;

      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cart empty" });
      }

      let subtotal = 0;
      let profit = 0;
      const invoiceItems = [];

      for (const item of items) {
        const batch = await prisma.batch.findUnique({
          where: { id: item.batchId },
          include: { medicine: true }
        });

        if (!batch || batch.quantity < item.quantity) {
          return res.status(400).json({ message: "Insufficient stock" });
        }

        const qty = Number(item.quantity);
        const buy = Number(batch.buyPrice);
        const sell = Number(batch.sellPrice);

        const lineTotal = sell * qty;

        subtotal += lineTotal;
        profit += (sell - buy) * qty;

        await prisma.batch.update({
          where: { id: batch.id },
          data: { quantity: batch.quantity - qty }
        });

        invoiceItems.push({
          batchId: batch.id,
          quantity: qty,
          buyPrice: buy,
          sellPrice: sell
        });
      }

      const last = await prisma.invoice.findFirst({
        orderBy: { id: "desc" }
      });

      const nextNo = last ? last.id + 1 : 1;
      const invoiceNo = `OP-${String(nextNo).padStart(6, "0")}`;

      const invoice = await prisma.invoice.create({
        data: {
          customerName,
          invoiceNo,
          subtotal: Number(subtotal.toFixed(2)),
          total: Number(subtotal.toFixed(2)),
          profit: Number(profit.toFixed(2)),
          paymentType,
          staffId: req.user.id,
          items: {
            create: invoiceItems
          }
        },
        include: {
          items: {
            include: {
              batch: {
                include: {
                  medicine: true
                }
              }
            }
          }
        }
      });

      res.json({ success: true, invoice });

    } catch (err) {
      console.error("Checkout error:", err);
      res.status(500).json({ message: "Checkout failed" });
    }
  }
);

module.exports = router;
