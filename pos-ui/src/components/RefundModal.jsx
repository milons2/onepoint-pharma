import React, { useState, useRef } from "react";
import refundService from "../services/refund.service.js";
import { Printer, X, CheckCircle2 } from "lucide-react";
import "../styles/refund.css";

const RefundModal = ({ isOpen, onClose, onRefresh }) => {
  const [invNo, setInvNo] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Voucher States
  const [showVoucher, setShowVoucher] = useState(false);
  const [voucherData, setVoucherData] = useState(null);
  const printRef = useRef();

  const resetModal = () => {
    setInvNo("");
    setInvoice(null);
    setSelectedItems([]);
    setVoucherData(null);
    setShowVoucher(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleSearch = async () => {
    if (!invNo) return;
    setLoading(true);
    try {
      const res = await refundService.getInvoice(invNo);
      setInvoice(res.data.data);
      setSelectedItems([]);
    } catch (err) {
      alert(err.response?.data?.message || "Invoice not found or fully returned.");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (item) => {
    const isSelected = selectedItems.find(i => i.invoiceItemId === item.id);
    if (isSelected) {
      setSelectedItems(selectedItems.filter(i => i.invoiceItemId !== item.id));
    } else {
      setSelectedItems([...selectedItems, {
        invoiceItemId: item.id,
        batchId: item.batchId,
        returnQty: item.remainingQty,
        sellPrice: item.sellPrice,
        name: item.batch.medicine.name
      }]);
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return alert("Select items to refund");
    const totalRefund = selectedItems.reduce((sum, i) => sum + (i.sellPrice * i.returnQty), 0);

    try {
      const res = await refundService.processRefund({
        invoiceId: invoice.id,
        items: selectedItems,
        reason: "Customer Return",
        refundType: "CASH",
        totalRefundAmount: totalRefund
      });

      setVoucherData({
        refundno: res.data.data.refundno,
        invoiceNo: invoice.invoiceNo,
        customerName: invoice.customerName,
        items: selectedItems,
        totalRefundAmount: totalRefund
      });

      setShowVoucher(true);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Refund failed");
    }
  };

  const handlePrintVoucher = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.write(`
      <html>
        <head>
          <title>Refund Voucher</title>
          <style>
            @page { margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; padding: 5mm; font-size: 11px; color: #000; }
            .text-center { text-align: center; }
            .hr { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0; }
            .total-row { font-weight: bold; font-size: 13px; margin-top: 5px; border-top: 1px solid #000; padding-top: 5px; }
            .footer-msg { font-size: 9px; margin-top: 15px; font-style: italic; }
            .signature { margin-top: 30px; border-top: 1px solid #000; display: inline-block; width: 100px; padding-top: 5px; }
          </style>
        </head>
        <body onload="window.print();window.close();">
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="refund-overlay">
      <div className="refund-modal-content">
        {!showVoucher ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0 }}>Refund Manager</h3>
              <X onClick={handleClose} style={{ cursor: 'pointer', color: '#64748b' }} />
            </div>

            <div className="search-row">
              <input
                value={invNo}
                onChange={(e) => setInvNo(e.target.value)}
                placeholder="Scan or Type Invoice Number..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                autoFocus
              />
              <button onClick={handleSearch} disabled={loading} className="find-btn">
                {loading ? "..." : "Search"}
              </button>
            </div>

            {invoice && (
              <div className="refund-body">
                <div className="inv-meta-card">
                  <p><strong>Customer:</strong> {invoice.customerName}</p>
                  <p><strong>Original Total:</strong> ৳{invoice.total.toFixed(2)}</p>
                </div>

                <div className="item-selection-list">
                  <p className="selection-hint">Select items to return:</p>
                  {invoice.items.map(item => (
                    <div key={item.id} className="item-row">
                      <div className="item-details">
                        <span className="name">{item.batch.medicine.name}</span>
                        <span className="qty">
                          Returnable: <strong>{item.remainingQty}</strong> 
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        className="refund-checkbox"
                        onChange={() => handleCheckboxChange(item)}
                        checked={!!selectedItems.find(i => i.invoiceItemId === item.id)}
                      />
                    </div>
                  ))}
                </div>

                <button className="confirm-btn" onClick={handleSubmit} disabled={selectedItems.length === 0}>
                  Confirm Return (৳{selectedItems.reduce((sum, i) => sum + (i.price || i.sellPrice * i.returnQty), 0).toFixed(2)})
                </button>
              </div>
            )}
            <button onClick={handleClose} className="cancel-link">Close Window</button>
          </>
        ) : (
          <div className="voucher-container animate-fade-in">
            <div className="success-header">
              <CheckCircle2 color="#22c55e" size={40} />
              <h4>Refund Processed!</h4>
            </div>

            <div ref={printRef} className="voucher-preview-box">
              <div className="text-center">
                <h3 style={{ margin: '0 0 2px 0' }}>ONEPOINT PHARMA</h3>
                <p style={{ margin: 0, fontSize: '10px' }}>All medicines trusted onepoint</p>
                <p style={{ margin: 0, fontSize: '9px' }}>4th Floor, Somobay Bank Shopping Complex, Rangpur | +880 1759085333</p>
              </div>
              
              <div className="hr"></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>REF NO:</strong> {voucherData.refundno}</span>
              </div>
              <div><strong>DATE:</strong> {new Date().toLocaleString()}</div>
              <div><strong>SRC INV:</strong> {voucherData.invoiceNo}</div>
              
              <div className="hr"></div>
              
              <table>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherData.items.map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '4px 0' }}>{it.name}</td>
                      <td style={{ textAlign: 'center' }}>{it.returnQty}</td>
                      <td style={{ textAlign: 'right' }}>৳{(it.sellPrice * it.returnQty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div className="total-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CASH REFUNDED:</span>
                <span>৳{voucherData.totalRefundAmount.toFixed(2)}</span>
              </div>

              <div className="text-center" style={{ marginTop: '20px' }}>
                <div className="signature">Authorized By</div>
                <p className="footer-msg">Please keep this voucher for your records.</p>
              </div>
            </div>

            <div className="voucher-actions">
              <button className="print-btn-primary" onClick={handlePrintVoucher}>
                <Printer size={18} /> Print Voucher
              </button>
              <button className="done-btn" onClick={handleClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundModal;