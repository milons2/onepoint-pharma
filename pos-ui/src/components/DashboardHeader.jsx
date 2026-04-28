import { useEffect, useState } from "react";
import { Bell, Search, User, Activity, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/dashboardHeader.css";
import headerLogo from "../assets/op_logo.png";


export default function DashboardHeader({ role = "OWNER", userName = "User", staffId }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [show, setShow] = useState(false);
  const [time, setTime] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  /* =========================
     REAL-TIME CLOCK
  ========================= */
  useEffect(() => {
    const t = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* =========================
     LIVE MEDICINE SEARCH
  ========================= */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        const res = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
        setResults(res.data.data || []);
        setShow(true);
      } catch {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  /* =========================
     FETCH NOTIFICATIONS ON CLICK
  ========================= */
  const handleNotificationClick = async () => {
    setNotifOpen((prev) => !prev);

    if (!notifOpen && staffId) {
      try {
        const res = await api.get(`/notifications/${staffId}`);
        setNotifications(res.data || []);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/read/${id}`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  return (
    <header className="dashboard-header">
      {/* LEFT: BRAND */}
      <div className="header-left">
        <div className="brand-box">
          <img 
            src={headerLogo} 
            alt="OnePoint Pharma" 
            className="header-logo-img" 
          />
          <div className="brand-text">
            <strong>Onepoint Pharma</strong>
            <span>All Medicines Trusted Onepoint</span>
          </div>
        </div>
      </div>

      {/* CENTER: SEARCH */}
      <div className="header-center">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            placeholder="Search medicine..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShow(true)}
            onBlur={() => setTimeout(() => setShow(false), 200)}
          />
          {show && (
            <div className="search-dropdown">
              {results.length === 0 ? (
                <div className="search-item empty">No medicine found</div>
              ) : (
                <div className="search-scroll">
                  {results.slice(0, 7).map((m) => (
                    <div key={m.id} className="search-item professional">
                      <div className="search-left">
                        <strong className="medicine-name">{m.name}</strong>
                        <span className="medicine-category">
                          {m.category?.name || "Uncategorized"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: STATUS + ACTIONS */}
      <div className="header-right">
        <div className="system-status">
          <Activity size={14} />
          <span>System Active</span>
        </div>

        <span className="clock">{time}</span>

        {/* =========================
            NOTIFICATION BUTTON
        ========================= */}
        <div className="notification-wrapper">
          <button
            className="icon-btn notification-btn"
            title="Notifications"
            onClick={handleNotificationClick}
          >
            <Bell size={18} />
            <span className={`notify-dot ${notifications.some(n => !n.read) ? "active" : "inactive"}`}></span>
          </button>

          {notifOpen && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                <div className="notification-scroll">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-item ${n.read ? "read" : "unread"}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <span className="notification-msg">{n.message}</span>
                      {!n.read && <Check size={14} className="notification-check" />}
                      <span className="notification-time">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <UserAvatar userName={userName} role={role} />
      </div>
    </header>
  );
}

/* =========================
   USER AVATAR MENU
========================= */
function UserAvatar({ userName, role }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function close(e) {
      if (!e.target.closest(".user-wrapper")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const goToProfile = () => {
    setOpen(false);
    navigate("/profile");
  };

  const goToSettings = () => {
    setOpen(false);
    navigate("/settings");
  };

  return (
    <div className="user-wrapper">
      <div className="avatar" title="Account" onClick={() => setOpen((v) => !v)}>
        <User size={18} />
      </div>

      {open && (
        <div className="user-menu">
          <div className="user-info"></div>
          <button onClick={goToProfile}>Profile</button>
          <button onClick={goToSettings}>Settings</button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
