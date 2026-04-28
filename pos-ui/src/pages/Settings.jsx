import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Shield, Bell, User, Settings as SettingsIcon } from "lucide-react";
import "../styles/settings.css";

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>

        <div>
          <h2 className="page-title">System Settings</h2>
          <p className="page-subtitle">
            Manage preferences, security, and system behavior
          </p>
        </div>
      </div>

      {/* PROFILE SETTINGS */}
      <div className="settings-card">
        <div className="card-header">
          <User size={18} />
          <h4>Profile Settings</h4>
        </div>

        <div className="form-group">
          <label>Display Name</label>
          <input type="text" placeholder="Enter your name" />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input type="email" placeholder="Enter your email" />
        </div>

        <div className="form-group">
          <label>Change Password</label>
          <input type="password" placeholder="New password" />
        </div>
      </div>

      {/* SYSTEM PREFERENCES */}
      <div className="settings-card">
        <div className="card-header">
          <SettingsIcon size={18} />
          <h4>System Preferences</h4>
        </div>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Enable system notifications
        </label>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Show live dashboard analytics
        </label>

        <label className="setting-item">
          <input type="checkbox" />
          Enable sound alerts
        </label>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Auto refresh reports every 5 minutes
        </label>
      </div>

      {/* NOTIFICATION SETTINGS */}
      <div className="settings-card">
        <div className="card-header">
          <Bell size={18} />
          <h4>Notification Controls</h4>
        </div>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Notify low stock medicines
        </label>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Notify expiring medicines
        </label>

        <label className="setting-item">
          <input type="checkbox" />
          Email notifications
        </label>
      </div>

      {/* SECURITY SETTINGS */}
      <div className="settings-card">
        <div className="card-header">
          <Shield size={18} />
          <h4>Security</h4>
        </div>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Require re-login after inactivity
        </label>

        <label className="setting-item">
          <input type="checkbox" />
          Enable two-factor authentication (2FA)
        </label>

        <label className="setting-item">
          <input type="checkbox" defaultChecked />
          Log all system activity
        </label>
      </div>

      {/* SAVE BUTTON */}
      <div className="settings-footer">
        <button className="save-btn">
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
