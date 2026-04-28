import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dailySummaryModal.css";

function DailySummaryModal({ isOpen, onClose }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication required. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    axios
      .get("http://localhost:3001/api/pharmacist/daily-summary", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.data.success) {
          setSummary(res.data.data);
        } else {
          setError("No summary data available");
        }
      })
      .catch(err => {
        console.error("Daily Summary Error:", err);
        setError("Failed to load daily summary");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>📊 Today’s Onepoint Summary</h2>

        {loading && <p className="loading">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {summary && (
          <div className="summary-grid">
            <div>
              <span>Gross Sales</span>
              <strong>৳ {summary.grossSales?.toFixed(2)}</strong>
            </div>

            <div className="refund">
              <span>Refunds</span>
              <strong>- ৳ {summary.refundTotal?.toFixed(2)}</strong>
            </div>

            <div className="net">
              <span>Net Sales</span>
              <strong>৳ {summary.netSales?.toFixed(2)}</strong>
            </div>

            <div>
              <span>Total Invoices</span>
              <strong>{summary.totalInvoices}</strong>
            </div>

            <div>
              <span>Cash Sales</span>
              <strong>৳ {summary.cashSales?.toFixed(2)}</strong>
            </div>

            {/* NEW: BKASH SECTION */}
            <div className="item-row bkash-highlight">
              <span>bKash payment</span>
              <strong>৳ {(summary.bkashSales || 0).toFixed(2)}</strong>
            </div>
            
            <div>
              <span>Card Sales</span>
              <strong>৳ {summary.cardSales?.toFixed(2)}</strong>
            </div>
          </div>
        )}

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default DailySummaryModal;
