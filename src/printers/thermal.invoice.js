const escpos = require('escpos');
escpos.USB = require('escpos-usb');

function printThermalInvoice(invoice) {
  const device = new escpos.USB();
  const printer = new escpos.Printer(device);

  device.open(() => {
    printer
      .align('ct')
      .text('ONEPOINT PHARMA')
      .text('------------------')
      .align('lt')
      .text(`Invoice: ${invoice.id}`)
      .text(`Customer: ${invoice.customerName}`)
      .text('------------------');

    invoice.items.forEach(item => {
  	const name = item.batch.medicine.name;
  	const lineTotal = item.quantity * item.sellPrice;

  	printer.text(`${name}`);
  	printer.text(`  ${item.quantity} x ${item.sellPrice} = ${lineTotal} BDT`);});

    printer
      .text('------------------')
      .text(`TOTAL: ${invoice.total} BDT`)
      .cut()
      .close();
  });
}

module.exports = { printThermalInvoice };