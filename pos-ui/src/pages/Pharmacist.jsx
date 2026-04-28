import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Pos from "./Pos";
import InventoryReadOnly from "./InventoryReadOnly";
import DailySummaryModal from "../components/DailySummaryModal"; // Import your new modal
import { 
  ShoppingCart, 
  PackageSearch, 
  LogOut, 
  LayoutDashboard  // <--- Added this missing icon
} from "lucide-react"; 
import "../styles/pharmacist.css";

function Pharmacist({ user, onLogout }) {
  const [page, setPage] = useState("pos");
  const [isSummaryOpen, setIsSummaryOpen] = useState(false); // State for Summary Modal

  useEffect(() => {
    if (!user || user.role !== "PHARMACIST") {
      localStorage.clear();
      window.location.href = "/login";
    }
  }, [user]);

  const sidebar = (
    <aside className="sidebar">
      <div className="sidebar-brand">
      </div>

      <nav className="sidebar-nav">
        <button 
          className={page === "pos" ? "nav-link active" : "nav-link"} 
          onClick={() => setPage("pos")}
        >
          <ShoppingCart size={18} /> <span>POS Billing</span>
        </button>

        <button 
          className={page === "inventory" ? "nav-link active" : "nav-link"} 
          onClick={() => setPage("inventory")}
        >
          <PackageSearch size={18} /> <span>Inventory (View)</span>
        </button>

        {/* Added Daily Summary Button */}
        <button 
          className="nav-link" 
          onClick={() => setIsSummaryOpen(true)}
          style={{ marginTop: '10px', color: '#38bdf8' }}
        >
          <LayoutDashboard size={18} /> <span>Daily Summary</span>
        </button>
      </nav>

    </aside>
  );

  return (
    <DashboardLayout sidebar={sidebar}>
      <div className="pharmacist-content-wrapper">
        {page === "pos" && <Pos user={user} />}
        {page === "inventory" && <InventoryReadOnly />}
      </div>

      {/* Render the Summary Modal */}
      <DailySummaryModal 
        isOpen={isSummaryOpen} 
        onClose={() => setIsSummaryOpen(false)} 
      />
    </DashboardLayout>
  );
}

export default Pharmacist;