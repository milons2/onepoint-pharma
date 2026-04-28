import React, { useEffect, useState } from "react";
import refundService from "../services/refund.service.js";
import { X, RefreshCcw, History, ReceiptText } from "lucide-react";
import "../styles/refund.css";

const RefundHistoryModal = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await refundService.getHistory();
      setHistory(res.data.data);
    } catch (err) {
      console.error("History fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="refund-overlay">
      <div className="refund-modal-content" style={{ width: '800px', maxWidth: '95%', padding: '25px' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f1f5f9', padding: '8px', borderRadius: '8px', color: '#1074d7' }}>
              <History size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>Refund & Return Records</h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>View all past return transactions</p>
            </div>
            <button 
              onClick={fetchHistory} 
              className="refresh-mini-btn" 
              title="Refresh Data"
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#1074d7', marginLeft: '10px' }}
            >
              <RefreshCcw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>
          <X style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={onClose} />
        </div>

        {/* Table Container */}
        <div className="history-table-container" style={{ 
          maxHeight: '60vh', 
          overflowY: 'auto', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px',
          background: '#fff'
        }}>
          {loading && history.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCcw size={30} className="spin" style={{ marginBottom: '10px' }} />
              <p>Loading transactions...</p>
            </div>
          ) : (
            <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
                <tr style={{ textAlign: 'left', fontSize: '0.8rem', color: '#475569', borderBottom: '2px solid #f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 20px' }}>Date</th>
                  <th style={{ padding: '14px 20px' }}>Refund No</th>
                  <th style={{ padding: '14px 20px' }}>Source Invoice</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Refund Amount</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.85rem' }}>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                      <ReceiptText size={40} style={{ opacity: 0.3, marginBottom: '10px' }} /><br />
                      No refund history found.
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="history-row-hover" style={{ borderBottom: '1px solid #f8fafc', transition: '0.2s' }}>
                      <td style={{ padding: '14px 20px', color: '#64748b' }}>
                        {new Date(h.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: '600', color: '#1e293b' }}>
                        {h.refundno}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#1074d7', fontWeight: '500' }}>
                        {h.Invoice?.invoiceNo}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.7rem', 
                          fontWeight: '700', 
                          background: '#ecfdf5', 
                          color: '#059669',
                          border: '1px solid #d1fae5'
                        }}>
                          COMPLETED
                        </span>
                      </td>
                      <td style={{ padding: '14px 20px', color: '#ef4444', fontWeight: '700', textAlign: 'right', fontSize: '0.95rem' }}>
                        ৳{h.refundAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer Actions */}
        <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Total Records: <strong>{history.length}</strong>
          </p>
          <button 
            className="close-btn" 
            onClick={onClose}
            style={{ 
              padding: '10px 24px', 
              background: '#f1f5f9', 
              color: '#475569', 
              border: 'none', 
              borderRadius: '6px', 
              fontWeight: '600', 
              cursor: 'pointer' 
            }}
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundHistoryModal;