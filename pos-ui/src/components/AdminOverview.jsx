import "../styles/admin.css";

export default function AdminOverview({ stats }) {
  if (!stats) return null;

  return (
    <div className="admin-overview">
      <div className="overview-card">
        <span>Today Sales</span>
        <h3>৳ {stats.todaySales}</h3>
      </div>

      <div className="overview-card">
        <span>Invoices Today</span>
        <h3>{stats.invoiceCount}</h3>
      </div>

      <div className="overview-card warning">
        <span>Low Stock</span>
        <h3>{stats.lowStock}</h3>
      </div>

      <div className="overview-card danger">
        <span>Expiring Soon</span>
        <h3>{stats.expiringSoon}</h3>
      </div>
    </div>
  );
}