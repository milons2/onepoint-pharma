import React from "react";
import "../styles/dashboardFooter.css";
import { Database, ShieldCheck, Activity } from "lucide-react";

function DashboardFooter() {
  return (
    <footer className="dashboard-footer">
      <div className="footer-left">
        <div className="status-item">
          <span className="status-dot pulse"></span>
          <Database size={14} />
          <span>PostgreSQL: Connected</span>
        </div>
        <div className="status-divider"></div>
        <div className="status-item">
          <ShieldCheck size={14} />
          <span>OnePoint Secure v1.0.2</span>
        </div>
      </div>

      <div className="footer-right">
        <span>© {new Date().getFullYear()} OnePoint Pharma —All Medicines Trusted OnePoint</span>
        <div className="status-divider"></div>
        <div className="status-item">
          <Activity size={14} />
          <span>System Healthy</span>
        </div>
      </div>
    </footer>
  );
}

export default DashboardFooter;