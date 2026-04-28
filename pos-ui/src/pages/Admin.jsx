import { useEffect, useState } from "react";
import InventoryWrapper from "./InventoryWrapper";
import Pos from "./Pos"; 
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/admin.css";
import "../styles/dashboardHeader.css";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  TrendingUp, 
  Calendar,
  Clock,
  ChevronRight,
  ShieldAlert,
  Activity
} from "lucide-react";

function Admin({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Cross-page navigation state
  const [autoSelectMed, setAutoSelectMed] = useState(null);

  useEffect(() => {
    if (page === "dashboard") loadDashboard();
  }, [page]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/admin");
      
      setStats({
        todaySales: response.data.todaySales,
        lowStockCount: response.data.lowStockCount,
        expiringSoonCount: response.data.expiringSoonCount,
        expiredCount: response.data.expiredCount
      });
      
      setAlerts(response.data.alerts);
    } catch (err) {
      console.error("Admin dashboard sync failed", err);
    } finally {
      setLoading(false);
    }
  }

  const handleViewInInventory = (medicine) => {
    setAutoSelectMed(medicine); 
    setPage("inventory"); 
  };

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-brand">
      </div>

      <nav className="sidebar-nav">
        <button className={page === "dashboard" ? "nav-link active" : "nav-link"} onClick={() => setPage("dashboard")}>
          <LayoutDashboard size={18} /> Dashboard
        </button>
        <button className={page === "inventory" ? "nav-link active" : "nav-link"} onClick={() => setPage("inventory")}>
          <Package size={18} /> Inventory
        </button>
        <button className={page === "pos" ? "nav-link active" : "nav-link"} onClick={() => setPage("pos")}>
          <ShoppingCart size={18} /> POS Billing
        </button>
      </nav>

    </aside>
  );

  return (
    <DashboardLayout sidebar={sidebar} >
      {page === "dashboard" && (
        <div className="adm-content">
          <header className="page-header">
            <div className="header-left">
              <div className="role-badge-top">ADMIN CONTROL</div>
              <div className="header-title-spacing">
                <h1 className="navy-title-main">System Analytics</h1>
                <p className="subtitle">Real-time inventory & sales monitoring</p>
              </div>
            </div>
            <div className="header-right">
               <div className="date-pill-branded">
                 <Calendar size={14} /> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
               </div>
            </div>
          </header>

          {loading ? (
            <div className="adm-loading-state-centered">
              <div className="adm-pulse-loader"></div>
              <p>Syncing Pharma Database...</p>
            </div>
          ) : stats && (
            <>
              {/* TOP PERFORMANCE CARDS */}
              <div className="adm-stats-grid-premium">
                <div className="adm-stat-card-pro adm-sales-bg">
                  <div className="adm-stat-icon-pro"><TrendingUp size={22} /></div>
                  <div className="adm-stat-data">
                    <span>Today's Net Revenue</span>
                    {/* We use Math.max to ensure we never show a negative number if data is null */}
                    <h3>৳ {Number(stats?.todaySales ?? 0).toLocaleString('en-BD', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}</h3>
                    <small>Updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                  </div>
                </div>

                <div className="adm-stat-card-pro adm-expired-bg">
                  <div className="adm-stat-icon-pro"><ShieldAlert size={22} /></div>
                  <div className="adm-stat-data">
                    <span>Expired Items</span>
                    <h3>{stats.expiredCount || 0} <small>Batches</small></h3>
                  </div>
                </div>

                <div className="adm-stat-card-pro adm-stock-bg">
                  <div className="adm-stat-icon-pro"><Activity size={22} /></div>
                  <div className="adm-stat-data">
                    <span>Stock Levels</span>
                    <h3>{stats.lowStockCount || 0} <small>Low Items</small></h3>
                  </div>
                </div>

                <div className="adm-stat-card-pro adm-expiry-bg">
                  <div className="adm-stat-icon-pro"><Clock size={22} /></div>
                  <div className="adm-stat-data">
                    <span>Expiring (30d)</span>
                    <h3>{stats.expiringSoonCount || 0} <small>Alerts</small></h3>
                  </div>
                </div>
              </div>

              {/* ACTIONABLE ALERTS PANEL */}
              {alerts && (
                <div className="adm-alerts-layout-pro">
                  <AlertPanel 
                    title="Expired - Immediate Removal" 
                    data={alerts.expired} 
                    type="adm-critical-pro-border" 
                    onItemClick={handleViewInInventory}
                  />
                  <AlertPanel 
                    title="Low Stock Alerts" 
                    data={alerts.lowStock} 
                    type="adm-danger-pro-border" 
                    onItemClick={handleViewInInventory}
                  />
                  <AlertPanel 
                    title="Expiry Warnings (Next 30 Days)" 
                    data={alerts.expiringSoon} 
                    type="adm-warning-pro-border"
                    onItemClick={handleViewInInventory}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {page === "inventory" && (
        <InventoryWrapper 
          autoSelect={autoSelectMed} 
          onClearSelect={() => setAutoSelectMed(null)} 
        />
      )}

      {page === "pos" && <Pos />}
    </DashboardLayout>
  );
}

function AlertPanel({ title, data, type, onItemClick }) {
  if (!data || data.length === 0) return null;
  
  return (
    <div className={`adm-alert-panel-pro ${type}`}>
      <div className="adm-panel-header-pro">
        <h4>{title}</h4>
        <span className="adm-count-tag">{data.length}</span>
      </div>
      <div className="adm-scroll-list-area">
        {data.map((item, i) => (
          <div key={i} className="adm-list-item-pro clickable-row" onClick={() => onItemClick(item.medicine)}>
            <div className="adm-item-info">
               <span className="adm-med-name-pro">{item.medicine?.name}</span>
               <div className="adm-item-meta-sub">
                 <span>Batch: {item.batchNo}</span>
                 <span className="separator">|</span>
                 <span>Exp: {new Date(item.expiryDate).toLocaleDateString()}</span>
               </div>
            </div>
            <div className="adm-item-action-area">
              <span className="qty-val">Qty: {item.quantity}</span>
              <div className="adm-action-pill-btn">
                Resolve <ChevronRight size={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Admin;