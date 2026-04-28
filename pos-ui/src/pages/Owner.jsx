import { useEffect, useState, useRef } from "react";
import InventoryWrapper from "./InventoryWrapper";
import StaffManager from "../components/StaffManager";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import BackupPage from "./BackupPage";
import "../styles/owner.css";
import "../styles/dashboardHeader.css";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  LogOut, 
  Wallet, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  ChevronRight,
  Activity,
  ShieldCheck, 
  Coins,
  LineChart,
  Database,
  FileDown
} from "lucide-react";

function Owner({ onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [weeklyChart, setWeeklyChart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSelectMed, setAutoSelectMed] = useState(null);
  const [renderingPDF, setRenderingPDF] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (page === "dashboard") loadDashboard();
  }, [page]);

  async function loadDashboard() {
    try {
      setLoading(true);
      const [dashboardRes, alertRes, chartRes] = await Promise.all([
        api.get("/dashboard/owner"),
        api.get("/alerts/inventory"),
        api.get("/dashboard/owner/weekly-chart")
      ]);
      setStats(dashboardRes.data.stats);
      setAlerts(alertRes.data.alerts);
      setWeeklyChart(chartRes.data.data || []);
    } catch (err) {
      console.error("Owner Dashboard load failed", err);
    } finally {
      setLoading(false);
    }
  }

  const handleExportPDF = async () => {
    try {
      const fileName = `OnePoint_Pharma_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // 1. Just send the data. main.js does all the hard work.
      const result = await window.electron.exportDashboardPDF({ 
        fileName, 
        stats 
      });

      if (result.success) {
        // You can replace alert with a nice toast notification later
        alert("Executive Report exported successfully!");
      } else {
        alert("Export Failed: " + (result.error || "Unknown Error"));
      }
    } catch (error) {
      console.error("Frontend PDF Error:", error);
      alert("System Error: Could not reach the PDF engine.");
    }
  };

  const handleAlertClick = (medicine) => {
    setAutoSelectMed(medicine);
    setPage("inventory");
  };

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-brand"></div>

      <nav className="sidebar-nav">
        <button className={page === "dashboard" ? "nav-link active" : "nav-link"} onClick={() => setPage("dashboard")}>
          <LayoutDashboard size={18} /> Business Hub
        </button>
        <button className={page === "inventory" ? "nav-link active" : "nav-link"} onClick={() => setPage("inventory")}>
          <Package size={18} /> Global Stock
        </button>
        <button className={page === "staff" ? "nav-link active" : "nav-link"} onClick={() => setPage("staff")}>
          <Users size={18} /> Staff Access
        </button>
        <button className={page === "backup" ? "nav-link active" : "nav-link"} onClick={() => setPage("backup")}>
          <Database size={18} /> Backup & Restore
        </button>
        {/* PDF EXPORT BUTTON */}
        <button
          className="nav-link export-trigger"
          onClick={!renderingPDF ? handleExportPDF : undefined}
          disabled={renderingPDF}
          style={{
            color: renderingPDF ? '#94a3b8' : '#10b981',
            marginTop: '10px',
            cursor: renderingPDF ? 'not-allowed' : 'pointer',
            border: 'none',
            background: 'none',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <FileDown size={18} style={{ marginRight: '8px' }} />
          <span>{renderingPDF ? "Processing..." : "Download PDF Summary"}</span>
        </button>
        
      </nav>

      
    </aside>
  );

  return (
    <>
      <DashboardLayout sidebar={sidebar}>
        {page === "dashboard" && (
          <div className="owner-content">
              {/* CENTERED HEADER SECTION */}
              <header className="owner-centered-header">
                <div className="role-badge-owner">OWNER</div>
                <h1 className="premium-title">CORPORATE EQUITY & ASSET APPRAISAL</h1>
                <p className="smart-subtitle">Comprehensive fiscal oversight and real-time valuation of 
        pharmaceutical holdings and liquid reserves for <strong>OnePoint Pharma</strong>.</p>
                <div className="header-date-row">
                  <Calendar size={14} /> <span>{new Date().toDateString()}</span>
                </div>
              </header>

              {loading && (
                <div className="loading-container">
                  <div className="pulse-loader"></div>
                  <p>Fetching Enterprise Analytics...</p>
                </div>
              )}

              {stats && (
                <>
                  {/* LIQUIDITY WIDGET PRO */}
                  <section className="liquidity-widget-pro">
                    <div className="widget-header">
                      <div className="header-title-group">
                        <h4>Capital Allocation</h4>
                        <span className="info-tag">Inventory vs. Cash</span>
                      </div>
                      <div className={`status-pill ${
                        stats.stockValue > stats.cashOnHand * 8 ? 'status-critical' : 
                        stats.stockValue > stats.cashOnHand * 5 ? 'status-warning' : 'status-healthy'
                      }`}>
                        <span className="pulse-icon"></span>
                        {stats.stockValue > stats.cashOnHand * 8 ? "Critical Alert" : 
                        stats.stockValue > stats.cashOnHand * 5 ? "Observation" : "Stable Liquidity"}
                      </div>
                    </div>
                    
                    <div className="balance-container">
                      <div className="balance-labels">
                        <div className="label-item">
                          <span className="dot stock-dot"></span>
                          <div className="texts">
                            <small>Physical Stock</small>
                            <strong>৳ {Number(stats.stockValue).toLocaleString()}</strong>
                          </div>
                        </div>
                        <div className="label-item text-right">
                          <div className="texts">
                            <small>Liquid Cash</small>
                            <strong>৳ {Number(stats.cashOnHand).toLocaleString()}</strong>
                          </div>
                          <span className="dot cash-dot"></span>
                        </div>
                      </div>

                      <div className="ratio-bar-track">
                        <div 
                          className="ratio-fill-stock" 
                          style={{ width: `${(stats.stockValue / (Number(stats.stockValue) + Number(stats.cashOnHand))) * 100}%` }}
                        ></div>
                        <div 
                          className="ratio-fill-cash" 
                          style={{ width: `${(stats.cashOnHand / (Number(stats.stockValue) + Number(stats.cashOnHand))) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="widget-insight-footer">
                        <div className={`insight-card ${
                          stats.stockValue > stats.cashOnHand * 5 ? 'alert-mode' : 'safe-mode'
                        }`}>
                          <div className="insight-main">
                            <span className="lightbulb">💡</span>
                            <p>
                              {stats.stockValue > stats.cashOnHand * 8 
                                ? "CRITICAL RISK: A disproportionate share of working capital is locked in inventory. Liquidity pressure is high, increasing the risk of delayed supplier payments, payroll stress, and missed opportunities." 
                                : stats.stockValue > stats.cashOnHand * 5
                                ? "ELEVATED RISK: Inventory exposure exceeds recommended thresholds. Cash reserves are limited relative to stock value. Prioritize liquidation of slow-moving items."
                                : "OPTIMIZED POSITION: Capital allocation is well balanced. Inventory levels support sales demand while maintaining sufficient cash reserves."}
                            </p>
                          </div>

                          <div className="how-it-works">
                            <h6>Capital Risk Assessment:</h6>
                            <p>
                              This module evaluates <strong>Capital Allocation Efficiency</strong> between inventory and liquid cash. 
                              In pharmacy operations, excessive stock accumulation converts working capital into 
                              <strong>non-performing assets</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="mini-metrics">
                          <div className="m-item">
                            <span>Liquidity Score</span>
                            <div className="score-group">
                              <div className="score-bar">
                                <div className="score-progress" style={{ width: `${((stats.cashOnHand / (Number(stats.stockValue) + Number(stats.cashOnHand))) * 100)}%` }}></div>
                              </div>
                              <strong>{((stats.cashOnHand / (Number(stats.stockValue) + Number(stats.cashOnHand))) * 100).toFixed(1)}%</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                  

                  {/* OWNER SPECIFIC STAT CARDS */}
                  <div className="stats-grid-premium">
                    <StatCard 
                      title="Today Sales" 
                      value={`৳ ${Number(stats.todaySales).toFixed(2)}`} 
                      icon={<div className="icon-container"><TrendingUp color="#10b981" /></div>}
                      color="sales-bg" 
                    />
                    <StatCard 
                      title="Daily Net Profit" 
                      value={`৳ ${stats.netProfit}`} 
                      icon={<div className="icon-container"><Activity color="#8b5cf6" /></div>} 
                      color="profit-bg" 
                    />
                    <StatCard 
                      title="Gross Monthly Revenue" 
                      value={`৳ ${stats.monthlyRevenue}`} 
                      icon={<div className="icon-container"><BarChart3 color="#3b82f6" /></div>} 
                      color="revenue-bg" 
                    />
                    <StatCard 
                      title="Monthly Net Profit" 
                      value={`৳ ${stats.monthlyNetProfit}`} 
                      icon={<div className="icon-container"><LineChart color="#0ea5e9" /></div>} 
                      color="monthly-profit-bg" 
                    />
                    <StatCard 
                      title="Total Portfolio Equity" 
                      value={`৳ ${Number(stats.wholeInvestAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                      icon={<div className="icon-container"><Wallet color="#f59e0b" size={24} /></div>} 
                      color="whole-invest-bg" 
                    />
                    <StatCard 
                      title="Cumulative Net Yield" 
                      value={`৳ ${Number(stats.wholeProfitAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} 
                      icon={<div className="icon-container"><Coins color="#059669" size={24} /></div>}
                      color="whole-profit-bg" 
                    />
                  </div>

                  {/* MARKET VALUATION HISTORY SECTION */}
                  <section className="market-valuation-card">
                    <div className="market-header">
                      <div className="market-badge">LIVE MARKET</div>
                      <div className="header-main-content">
                        <h3>Financial History: Daily Sales & Profit Analysis</h3>
                        <div className="market-stats-pill">
                          <span className="pill-label">Total Records:</span>
                          <span className="pill-value">{weeklyChart.length} Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="chart-pro-container">
                      <div className="price-y-axis">
                        {(() => {
                          const allValues = weeklyChart.flatMap(d => [Number(d.sales), Number(d.profit)]);
                          const maxVal = Math.max(...allValues, 100); 
                          return [1, 0.75, 0.5, 0.25, 0].map((level, i) => (
                            <span key={i}>৳{(maxVal * level / 1000).toFixed(1)}k</span>
                          ));
                        })()}
                      </div>

                      <div className="market-scroll-wrapper">
                        <div className="market-track-container">
                          {weeklyChart.map((d, i) => {
                            const globalMax = Math.max(...weeklyChart.flatMap(v => [v.sales, v.profit]), 1);
                            return (
                              <div key={i} className="market-day-column">
                                <div className="pillar-values">
                                    <span className="sales-text">S:৳ {Math.round(d.sales)}</span>
                                    <span className="profit-text">P:৳ {Math.round(d.profit)}</span>
                                </div>
                                <div className="pillar-track">
                                    <div className="pillar sales-p" style={{ height: `${(Math.max(0, d.sales) / globalMax) * 100}%` }} />
                                    <div className="pillar profit-p" style={{ height: `${(Math.max(0, d.profit) / globalMax) * 100}%` }} />
                                </div>
                                <div className="pillar-date">
                                    {new Date(d.day).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="market-legend">
                      <div className="legend-item">
                        <span className="dot sales-dot"></span>
                        <span>Total Sales</span>
                      </div>
                      <div className="legend-item">
                        <span className="dot profit-dot"></span>
                        <span>Net Profit</span>
                      </div>
                    </div>
                  </section>

                  <section className="growth-overview-grid">
                    <div className="growth-card-premium slide-bg-green">
                      <div className="card-inner-content">
                        <div className="growth-info">
                          <h4 className="card-label">Monthly Growth</h4>
                          <div className="growth-stat-row">
                            <span className={`percentage-pill ${stats.monthlyGrowth >= 0 ? "up" : "down"}`}>
                              {stats.monthlyGrowth >= 0 ? "↑" : "↓"} {Math.abs(stats.monthlyGrowth)}%
                            </span>
                            <span className="vs-context">vs last month</span>
                          </div>
                        </div>
                        <div className="card-icon-glass">
                          <TrendingUp size={28} />
                        </div>
                      </div>
                      <div className="border-bottom-glow"></div>
                    </div>

                    <div className="growth-card-premium slide-bg-blue">
                      <div className="card-inner-content">
                        <div className="growth-info">
                          <h4 className="card-label">Avg. Order Value</h4>
                          <div className="growth-stat-row">
                            <h3 className="premium-value-text">৳ {stats.avgOrderValue}</h3>
                            <span className="vs-context">per invoice</span>
                          </div>
                        </div>
                        <div className="card-icon-glass">
                          <Users size={28} />
                        </div>
                      </div>
                      <div className="border-bottom-glow"></div>
                    </div>
                  </section>

                  {/* ALERTS SECTION */}
                  <div className="alerts-layout-pro">
                    <AlertPanel 
                      title="Expired Stock" 
                      data={alerts?.expired} 
                      type="danger-pro-border" 
                      onItemClick={handleAlertClick} 
                    />
                    <AlertPanel 
                      title="Expiring Soon" 
                      data={alerts?.expiringSoon} 
                      type="warning-pro-border" 
                      onItemClick={handleAlertClick} 
                    />
                    <AlertPanel 
                      title="Low Inventory" 
                      data={alerts?.lowStock} 
                      type="danger-pro-border" 
                      onItemClick={handleAlertClick} 
                    />
                  </div>
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
        {page === "staff" && <StaffManager />}
        {page === "backup" && <BackupPage />}

        {/* THE GHOST LAYER: Fixes the 0-byte and Blank PDF problem */}
        {renderingPDF && (
          <div
            ref={printRef}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              minHeight: '100vh',
              backgroundColor: '#ffffff',
              zIndex: 9999,
              overflow: 'visible',
              padding: '40px'
            }}
          >
            <SummaryReport stats={stats} />
          </div>
        )}
      </DashboardLayout>
    </>
  );
}

/* =========================
    REUSABLE COMPONENTS
========================= */

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`stat-card-pro ${color}`}>
      <div className="stat-icon-pro">{icon}</div>
      <div className="stat-data">
        <span>{title}</span>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function AlertPanel({ title, data, type, onItemClick }) {
  if (!data || data.length === 0) return null;
  return (
    <div className={`alert-panel-pro ${type}`}>
      <div className="panel-header-pro">
        <h4>{title}</h4>
        <span className="count-tag">{data.length}</span>
      </div>
      <div className="scroll-list-area">
        {data.map((item, i) => (
          <div key={i} className="list-item-pro clickable-row" onClick={() => onItemClick(item.medicine)}>
            <div className="item-info">
               <span className="med-name-pro">{item.medicine?.name}</span>
               <small>Qty: {item.quantity}</small>
            </div>
            <div className="item-action">
              <ChevronRight size={14} color="#94a3b8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Owner;