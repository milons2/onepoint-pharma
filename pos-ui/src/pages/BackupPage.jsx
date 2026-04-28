import React, { useState, useEffect } from "react";
import { Database, Download, RotateCcw, Clock, ShieldCheck } from "lucide-react";

/**
 * IPC BRIDGE DETECTION
 */
const getIpc = () => {
  try {
    // 1. Try the electronAPI from preload
    if (window.electronAPI && window.electronAPI.invoke) {
      return window.electronAPI;
    }
    // 2. Direct fallback (works because nodeIntegration is true)
    if (window.require) {
      return window.require("electron").ipcRenderer;
    }
  } catch (e) {
    console.error("Bridge detection failed", e);
  }
  return null;
};

const ipcRenderer = getIpc();

const BackupPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchHistory = async () => {
    if (!ipcRenderer) return;
    try {
      const data = await ipcRenderer.invoke("get-backup-history");
      setHistory(data || []);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleBackup = async () => {
    if (!ipcRenderer) return alert("System Error: IPC Bridge not found.");
    if (!window.confirm("Create manual backup now?")) return;

    setIsProcessing(true);
    setLoading(true);
    try {
      const res = await ipcRenderer.invoke("db-manual-backup");
      alert(res);
      fetchHistory(); 
    } catch (err) {
      alert("Backup Failed: " + err);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!ipcRenderer) return alert("System Error: IPC Bridge not found.");
    if (!window.confirm("CRITICAL: Overwrite database?")) return;

    setIsProcessing(true);
    setLoading(true);
    try {
      const res = await ipcRenderer.invoke("db-manual-restore");
      alert(res);
      window.location.reload();
    } catch (err) {
      alert("Restore Failed: " + err);
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <div className="owner-content-area" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {isProcessing && (
        <div className="processing-overlay">
          <div className="loader-content">
            <div className="spinner"></div>
            <h3>Database Task in Progress</h3>
            <p>Processing system files, please do not close the app...</p>
          </div>
        </div>
      )}

      <div className="backup-header-flex">
        <h2><Database size={22} className="text-blue-500" /> Database Management</h2>
        <span className="auto-tag">
          <ShieldCheck size={14} /> Automatic Midnight Backup Active
        </span>
      </div>

      <div className="backup-hero-cards">
        <div 
          className={`b-card b-green ${loading ? 'disabled' : ''}`} 
          onClick={!loading ? handleBackup : null}
        >
          <Download size={32} />
          <div>
            <h3>Backup Now</h3>
            <p>Generate fresh manual snapshot</p>
          </div>
        </div>

        <div 
          className={`b-card b-red ${loading ? 'disabled' : ''}`} 
          onClick={!loading ? handleRestore : null}
        >
          <RotateCcw size={32} />
          <div>
            <h3>Restore Latest</h3>
            <p>Rollback to most recent backup</p>
          </div>
        </div>
      </div>

      <div className="history-table-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <h3><Clock size={18} /> Backup History (Local Drive D:)</h3>
        
        {/* ADDED SCROLL SECTION HERE */}
        <div className="table-responsive" style={{ 
          overflowY: 'auto', 
          maxHeight: '400px', // Adjust this height as needed
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          background: '#fff'
        }}>
          <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Filename</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Date & Time Created</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>File Size</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((file, i) => (
                  <tr key={i} className={i === 0 ? "latest-row" : ""} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td className="file-name" style={{ padding: '12px' }}>{file.name}</td>
                    <td style={{ padding: '12px' }}>{new Date(file.createdAt).toLocaleString()}</td>
                    <td style={{ padding: '12px' }}>{file.size}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No backup history found in D:\OPP_Backups
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BackupPage;