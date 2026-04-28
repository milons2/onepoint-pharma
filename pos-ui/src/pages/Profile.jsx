import { User, Shield, Mail, Phone, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  if (!user) return null;

  return (
    <div className="profile-wrapper">

      <div className="profile-card">

        {/* Back Button */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="profile-header">
          <h2>My Profile</h2>
          <p>View and manage your account information</p>
        </div>

        {/* Avatar */}
        <div className="profile-avatar">
          <div className="avatar-circle">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3>{user.name}</h3>
            <span className="role-badge">{user.role}</span>
          </div>
        </div>

        <div className="divider" />

        {/* Info */}
        <div className="profile-info">

          <div className="profile-row">
            <User size={18} />
            <div>
              <span>Name</span>
              <b>{user.name}</b>
            </div>
          </div>

          <div className="profile-row">
            <Shield size={18} />
            <div>
              <span>Role</span>
              <b>{user.role}</b>
            </div>
          </div>

          <div className="profile-row">
            <Mail size={18} />
            <div>
              <span>Email</span>
              <b>{user.email ? user.email : "Not Available"}</b>
            </div>
          </div>

          <div className="profile-row">
            <Phone size={18} />
            <div>
              <span>Phone</span>
              <b>{user.phone ? user.phone : "Not Provided"}</b>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
