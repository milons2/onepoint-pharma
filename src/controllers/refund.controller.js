const prisma = require("../config/prisma");

// 1. Search Invoice for Refund (Fixed Duplicate Return Issue)
exports.getInvoiceForRefund = async (req, res) => {
    try {
        const { invoiceNo } = req.params;

        const invoice = await prisma.invoice.findFirst({
            where: {
                invoiceNo: {
                    equals: invoiceNo,
                    mode: 'insensitive'
                }
            },
            include: {
                items: {
                    include: {
                        batch: {
                            include: { medicine: true }
                        },
                        RefundItem: true 
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: "Invoice not found" });
        }

        // Logic to filter out items already returned
        const filteredItems = invoice.items.map(item => {
            const totalReturned = item.RefundItem.reduce((sum, r) => sum + r.quantity, 0);
            return {
                ...item,
                remainingQty: item.quantity - totalReturned
            };
        }).filter(item => item.remainingQty > 0); 

        if (filteredItems.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "This invoice has already been fully returned." 
            });
        }

        res.json({ success: true, data: { ...invoice, items: filteredItems } });
    } catch (err) {
        console.error("PRISMA ERROR:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Process the Refund Transaction
exports.processRefund = async (req, res) => {
    const { invoiceId, items, reason, refundType, totalRefundAmount } = req.body;
    const staffId = req.user?.id || 1; 

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create Refund Header
            const refund = await tx.refund.create({
                data: {
                    refundno: `REF-${Date.now()}`,
                    invoiceId: parseInt(invoiceId),
                    staffId: staffId,
                    reason,
                    refundType,
                    refundAmount: parseFloat(totalRefundAmount)
                }
            });

            for (const item of items) {
                // Create Refund Item
                await tx.refundItem.create({
                    data: {
                        refundId: refund.id,
                        invoiceItemId: item.invoiceItemId,
                        quantity: parseInt(item.returnQty),
                        sellPrice: parseFloat(item.sellPrice),
                        returnStock: true
                    }
                });

                // Increment Stock in Batch
                await tx.batch.update({
                    where: { id: item.batchId },
                    data: { quantity: { increment: parseInt(item.returnQty) } }
                });
            }

            // --- REAL-TIME TICKER UPDATE LOGIC (Calculates Net Sales) ---
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            // Fetch Gross Sales and Refund Sum in parallel
            const [salesAgg, refundAgg, countAgg] = await Promise.all([
                tx.invoice.aggregate({
                    where: { createdAt: { gte: startOfDay } },
                    _sum: { total: true }
                }),
                tx.refund.aggregate({
                    where: { createdAt: { gte: startOfDay } },
                    _sum: { refundAmount: true }
                }),
                tx.invoice.count({
                    where: { createdAt: { gte: startOfDay } }
                })
            ]);

            // Calculate Net Sales = (Sum of Invoices) - (Sum of Refunds)
            const netSales = (salesAgg._sum.total || 0) - (refundAgg._sum.refundAmount || 0);
            const currentTotalInvoices = countAgg || 0;

            // Emit to Socket for Live Ticker update
            const io = req.app.get("socketio");
            if (io) {
                io.emit("NEW_SALE_EVENT", {
                    isSilent: true, 
                    totalSales: netSales, // Send NET amount
                    totalInvoices: currentTotalInvoices,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    amount: 0, 
                    invoiceNo: "REFUND-UPDATE"
                });
            }
            // --- REAL-TIME TICKER UPDATE LOGIC (Ends Here) ---

            return refund;
        });

        res.json({ success: true, data: result });
    } catch (err) {
        console.error("REFUND ERROR:", err);
        res.status(400).json({ success: false, message: err.message });
    }
};

// 3. Get Refund History
exports.getRefundHistory = async (req, res) => {
    try {
        const history = await prisma.refund.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                staff: { select: { name: true } },
                Invoice: { select: { invoiceNo: true, customerName: true } },
                RefundItem: {
                    include: {
                        InvoiceItem: {
                            include: {
                                batch: {
                                    include: { medicine: true }
                                }
                            }
                        }
                    }
                }
            }
        });
        res.json({ success: true, data: history });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};