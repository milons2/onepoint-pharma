import React, { useRef, useState, useEffect } from "react";
import "../styles/invoicePrint.css";
import invoiceLogo from "../assets/onepoint_black.png";

export default function InvoiceModal({
  open,
  onClose,
  invoice,
  staffId,
  printType,
  setPrintType
}) {
  const printRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Resize fix when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      }, 150);
    }
  }, [printType, open]);

  // ---------------- PRINT HANDLER ----------------
  const handlePrintAction = async () => {
    if (!invoice) return;
    const isThermal = printType === "thermal";

    try {
      setIsPrinting(true);
      
      // CRITICAL: Give the UI 500ms to stop animations before printing
      await new Promise(resolve => setTimeout(resolve, 500));

      if (window.require) {
        const { ipcRenderer } = window.require("electron");
        
        // Invoke the print command
        const response = await ipcRenderer.invoke("print-invoice", {
          silent: isThermal, // This bypasses the "Preview Not Supported" error
          deviceName: ""     // Uses system default
        });

        if (response.success) {
          console.log("Print command sent to Windows Spooler");
        } else {
          alert("Printer Error: " + response.error);
        }
      } else {
        window.print(); // Browser fallback
      }
    } catch (err) {
      alert("System Error: " + err.message);
    } finally {
      setIsPrinting(false);
    }
  };
  // ------------------------------------------------

  if (!open || !invoice) return null;

  return (
    <div className="invoice-modal-overlay">
      <div className="invoice-modal-card">
        <div className="modal-controls">
          <div className="print-type-selector">
            <button
              className={printType === "a4" ? "active" : ""}
              onClick={() => setPrintType("a4")}
            >
              A4 Paper
            </button>
            <button
              className={printType === "thermal" ? "active" : ""}
              onClick={() => setPrintType("thermal")}
            >
              Thermal (80mm)
            </button>
          </div>

          <div className="action-btns">
            <button className="btn-print" onClick={handlePrintAction}>
              {printType === "thermal" ? "Direct Print" : "Print"}
            </button>

            <button className="btn-close" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="print-scroll-container">
          <div ref={printRef} className={`printable-content ${printType}-size`}>
            <div className="bill-head">
              <div className="invoice-logo-container">
                <img
                  src={invoiceLogo}
                  alt="OnePoint Pharma Logo"
                  className="invoice-logo"
                />
              </div>

              <h1>
                ONEPOINT <span>PHARMA</span>
              </h1>
              <h4>All medicines trusted onepoint</h4>
              <p>
                Shop No #39, 4th Floor, Somobay Bank Shopping Complex, Rangpur
              </p>
              <p>Contact: +8801759085333</p>

              <div className="bill-title-wrapper">
                <div className="bill-title">CASH MEMO</div>
              </div>
            </div>

            {/* META */}
            <div className="bill-meta-grid">
              <div className="meta-col">
                <p>
                  <strong>Invoice No:</strong>{" "}
                  {invoice.invoiceNo || "Pending..."}
                </p>
                <p>
                  <strong>Customer:</strong>{" "}
                  {invoice.customerName || "Walk-in Customer"}
                </p>
              </div>
              <div className="meta-col text-right">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(
                    invoice.createdAt || Date.now()
                  ).toLocaleDateString()}
                </p>
                <p>
                  <strong>Payment:</strong> {invoice.paymentType || "CASH"}
                </p>
              </div>
            </div>

            {/* ITEMS TABLE */}
            <table className="bill-table">
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, idx) => {
                  const name =
                    item.name ||
                    item.batch?.medicine?.name ||
                    "Unknown";

                  const qty = Number(item.quantity || 0);
                  const price = Number(
                    item.price ||
                      item.sellPrice ||
                      item.batch?.sellPrice ||
                      0
                  );

                  return (
                    <tr key={idx}>
                      <td>{name}</td>
                      <td>{qty}</td>
                      <td>{price.toFixed(2)}</td>
                      <td className="text-right">
                        {(qty * price).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* SUMMARY */}
            <div className="bill-summary-box">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>
                  BDT{" "}
                  {Number(
                    invoice.subtotal || invoice.total || 0
                  ).toFixed(2)}
                </span>
              </div>

              <div className="summary-line">
                <span>Discount ({invoice.discountPercent || 0}%)</span>
                <span>
                  BDT {Number(invoice.discountAmount || 0).toFixed(2)}
                </span>
              </div>

              <div className="summary-line">
                <span>VAT ({invoice.vatPercent || 0}%)</span>
                <span>
                  BDT {Number(invoice.vatAmount || 0).toFixed(2)}
                </span>
              </div>

              <div className="summary-line total-row">
                <span>Net Payable</span>
                <span>
                  BDT{" "}
                  {Number(
                    invoice.grandTotal || invoice.total || 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* HEALTH TIPS */}
            <div className="health-tips-footer">
              <div className="tip-item">
                * অ্যান্টিবায়োটিকের সম্পূর্ণ কোর্স সম্পন্ন করুন।
              </div>
              <div className="tip-item">
                * ঔষধ সূর্যালোক ও আর্দ্রতা থেকে দূরে রাখুন।
              </div>
              <div className="tip-item">
                * সকল ঔষধ শিশুদের নাগালের বাইরে রাখুন।
              </div>
            </div>

            <div className="footer-copyright">
              <p>Thank you. Get well soon!</p>
              <br />
              <small>Powered by OnePoint Pharma System</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}