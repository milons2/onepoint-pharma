import DashboardHeader from "../components/DashboardHeader";
import DashboardFooter from "../components/DashboardFooter";

function DashboardLayout({ sidebar, children, user, role }) {
  return (
    <div className="dashboard-container">
      {/* Pass user and role to header */}
      <DashboardHeader userName={user?.name || "User"} role={role} />

      <div className="dashboard-body">
        {sidebar}

        <main className="dashboard-content">
          {children}
        </main>
      </div>

      <DashboardFooter />
    </div>
  );
}

export default DashboardLayout;
