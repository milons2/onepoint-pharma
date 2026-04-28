import React, { useRef } from "react";
import { Printer, X } from "lucide-react";
import "../styles/refund.css";

const RefundVoucher = ({ isOpen, onClose, data }) => {
  const printRef = useRef();

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Refund Voucher</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; }
            .text-center { text-align: center; }
            .hr { border-bottom: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; font-size: 12px; }
            td { font-size: 12px; padding: 5px 0; }
            .total { font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="refund-overlay">
      <div className="refund-modal-content" style={{ width: "400px" }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h3>Refund Voucher Preview</h3>
          <X onClick={onClose} style={{ cursor: 'pointer' }} />
        </div>

        <div ref={printRef} className="voucher-print-area">
          <div className="text-center">
            <h2 style={{ margin: 0 }}>ONEPOINT PHARMA</h2>
            <p style={{ fontSize: '12px' }}>Refund Receipt</p>
          </div>
          <div className="hr"></div>
          <p><strong>Ref No:</strong> {data.refundno}</p>
          <p><strong>Inv No:</strong> {data.invoiceNo}</p>
          <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
          <div className="hr"></div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.returnQty}</td>
                  <td>৳{(item.sellPrice * item.returnQty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="hr"></div>
          <div className="total">
            <span>TOTAL REFUNDED:</span>
            <span style={{ float: 'right' }}>৳{data.totalRefundAmount.toFixed(2)}</span>
          </div>
          <div className="hr"></div>
          <p style={{ fontSize: '10px' }} className="text-center">Thank you for your patience.</p>
        </div>

        <button className="checkout-primary-btn" onClick={handlePrint} style={{ marginTop: '20px' }}>
          <Printer size={16} /> Print Voucher
        </button>
      </div>
    </div>
  );
};

export default RefundVoucher;