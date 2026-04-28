import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import Owner from './Owner';
import Admin from './Admin';
import Pharmacist from './Pharmacist';
import LiveTicker from "../components/LiveTicker";


function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      window.location.href = '/login';
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (!user) return null;

  // This function wraps the components to provide the necessary top gap
  const renderDashboardContent = () => {
    switch (user.role) {
      case 'OWNER':
        return <Owner user={user} onLogout={logout} />;
      case 'ADMIN':
        return <Admin user={user} onLogout={logout} />;
      case 'PHARMACIST':
        return <Pharmacist user={user} onLogout={logout} />;
      default:
        return <h3>Unauthorized role</h3>;
    }
  };

  return (
    <div className="dashboard-main-root">
      {/* 1. Ticker stays at the very top */}
      <LiveTicker />

      {/* 2. Content starts below the ticker */}
      <div className="dashboard-content-container">
        {renderDashboardContent()}
      </div>

    </div>
  );
}

export default Dashboard;