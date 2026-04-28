import { useNavigate } from "react-router-dom";

export default function RoleCard({ role, title, subtitle }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/login/${role}`)}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        width: "220px",
        cursor: "pointer",
        textAlign: "center",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
      }}
    >
      <h3>{title}</h3>
      <p style={{ fontSize: "14px", color: "#6b7280" }}>{subtitle}</p>
    </div>
  );
}