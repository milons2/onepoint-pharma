const prisma = require("../config/prisma");

/*
=====================================================
 CREATE INVOICE (POS BILLING) - UPDATED WITH SOCKET
=====================================================
*/
exports.createInvoice = async (req, res) => {
  // 🔐 staffId from JWT
  const staffId = req.user?.id;

  const {
    customerName = "Walk-in Customer",
    paymentType = "CASH",
    items,
    discount = 0,
    vat = 0, // Received from frontend if available
  } = req.body;

  // ---------------- VALIDATION ----------------
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty. Please add items.",
    });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalProfit = 0;

      // 1. GENERATE INVOICE NUMBER
      const year = new Date().getFullYear();
      const seq = await tx.invoiceSequence.upsert({
        where: { year },
        update: { lastNo: { increment: 1 } },
        create: { year, lastNo: 1 },
      });

      const invoiceNo = `OPP-${year}-${seq.lastNo.toString().padStart(4, '0')}`;

      // 2. CREATE THE INVOICE RECORD
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerName,
          staffId: staffId || 1,
          subtotal: 0,
          total: 0,
          profit: 0,
          paymentType,
          createdAt: new Date(),
        },
      });

      // 3. PROCESS ITEMS (FIFO)
      for (const item of items) {
        const medicineId = Number(item.medicineId);
        let qtyToDeduct = Number(item.quantity);

        const batches = await tx.batch.findMany({
          where: { medicineId, quantity: { gt: 0 } },
          orderBy: { expiryDate: "asc" },
        });

        const available = batches.reduce((sum, b) => sum + b.quantity, 0);
        if (available < qtyToDeduct) {
          throw new Error(`Stock insufficient for Medicine ID ${medicineId}`);
        }

        for (const batch of batches) {
          if (qtyToDeduct <= 0) break;
          const deduct = Math.min(batch.quantity, qtyToDeduct);

          await tx.invoiceItem.create({
            data: {
              invoiceId: invoice.id,
              batchId: batch.id,
              quantity: deduct,
              buyPrice: batch.buyPrice,
              sellPrice: batch.sellPrice,
            },
          });

          await tx.batch.update({
            where: { id: batch.id },
            data: { quantity: { decrement: deduct } },
          });

          subtotal += deduct * batch.sellPrice;
          totalProfit += deduct * (batch.sellPrice - batch.buyPrice);
          qtyToDeduct -= deduct;
        }
      }

      // 4. CALCULATE FINAL TOTALS
      const vatAmount = (subtotal * Number(vat)) / 100;
      const grandTotal = subtotal + vatAmount - Number(discount);

      // 5. UPDATE INVOICE WITH FINISHED TOTALS
      return await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          total: parseFloat(grandTotal.toFixed(2)),
          profit: parseFloat(totalProfit.toFixed(2)),
        },
        include: {
          items: {
            include: {
              batch: {
                include: { medicine: true }
              }
            }
          }
        }
      });
    });

    // ---------------- START: REAL-TIME TICKER UPDATE LOGIC ----------------
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get updated daily stats (Invoices - Refunds)
      const [salesAgg, refundAgg, countAgg] = await Promise.all([
        prisma.invoice.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { total: true }
        }),
        prisma.refund.aggregate({
          where: { createdAt: { gte: today } },
          _sum: { refundAmount: true }
        }),
        prisma.invoice.count({
          where: { createdAt: { gte: today } }
        })
      ]);

      const netSales = (salesAgg._sum.total || 0) - (refundAgg._sum.refundAmount || 0);

      // Emit to Socket.io
      if (req.app.get("socketio")) {
        req.app.get("socketio").emit("NEW_SALE_EVENT", {
          invoiceNo: result.invoiceNo,
          amount: result.total.toFixed(2),
          totalSales: netSales, // Using calculated Net Sales
          totalInvoices: countAgg || 0,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    } catch (socketErr) {
      console.error("Ticker Sync Error:", socketErr);
    }
    // ---------------- END: REAL-TIME TICKER UPDATE LOGIC ----------------

    // ---------------- FINAL RESPONSE FOR FRONTEND ----------------
    return res.json({
      success: true,
      data: {
        ...result,
        invoiceNo: result.invoiceNo,
        vat: (result.subtotal * Number(vat)) / 100,
        discount: Number(discount),
        grandTotal: result.total.toFixed(2),
        healthTips: [
          "✔ Finish your full course of antibiotics.",
          "✔ Keep out of reach of children.",
          "✔ Store in a cool, dry place.",
          "✔ Consult a doctor if symptoms persist."
        ],
        address: "Shop No 39, 4th Floor, Somobay Bank Shopping Complex, Station Road, Rangpur",
        brand: "OnePoint Pharma"
      }
    });

  } catch (err) {
    console.error("Billing Logic Error:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "Billing failed",
    });
  }
};