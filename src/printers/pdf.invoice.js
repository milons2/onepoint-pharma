const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoicePDF(invoice) {
  const filePath = path.join(
    __dirname,
    '../../invoices',
    `invoice-${invoice.id}.pdf`
  );

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text('ONEPOINT PHARMA', { align: 'center' });
  doc.fontSize(10).text('Invoice', { align: 'center' });
  doc.moveDown();

  doc.text(`Invoice ID: ${invoice.id}`);
  doc.text(`Customer: ${invoice.customerName}`);
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleString()}`);
  doc.moveDown();

  doc.text('Items:', { underline: true });

  invoice.items.forEach(item => {
  const name = item.batch.medicine.name;
  const lineTotal = item.quantity * item.sellPrice;

  doc.text(
    `${name}  x${item.quantity}  @ ${item.sellPrice} = ${lineTotal} BDT`
  );
	});

  doc.moveDown();
  doc.text(`Total: ${invoice.total} BDT`);

  doc.end();
  return filePath;
}

module.exports = { generateInvoicePDF };