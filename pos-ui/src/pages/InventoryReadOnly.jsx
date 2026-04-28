import { useEffect, useState } from "react";
import api from "../services/api";
import { Search, Loader2, Package } from "lucide-react"; // Professional Icons
import "../styles/inventoryReadOnly.css";

function InventoryReadOnly() {
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setMedicines([]);
      return;
    }

    const delay = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get(`/medicines/search?q=${encodeURIComponent(query)}`);
        setMedicines(Array.isArray(res.data.data) ? res.data.data : []);
      } catch (err) {
        setMedicines([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="inventory-read-only-container">
      <header className="inventory-view-header">
        <div className="title-section">
          <Package className="title-icon" size={24} />
          <h2>Inventory <span>Global View</span></h2>
        </div>
        
        <div className="search-wrapper-premium">
          <Search className="search-icon-inside" size={18} />
          <input
            type="text"
            placeholder="Search by medicine name or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="table-card-premium">
        {loading && (
          <div className="status-message">
            <Loader2 className="spinner" />
            <p>Scanning database...</p>
          </div>
        )}

        {!loading && query && medicines.length === 0 && (
          <div className="status-message empty">
            <p>No matching medicines found in stock.</p>
          </div>
        )}

        {medicines.length > 0 && (
          <div className="table-responsive">
            <table className="inventory-table-pro">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Stock Status</th>
                  <th className="text-right">Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, i) => {
                  const batches = m.batches || [];
                  const totalStock = batches.reduce((sum, b) => sum + (b.quantity || 0), 0);
                  const sellPrice = batches.length > 0 ? Math.max(...batches.map((b) => b.sellPrice || 0)) : 0;
                  
                  // Professional Stock Labeling
                  const stockStatus = totalStock <= 0 ? "out" : totalStock < 50 ? "low" : "ok";

                  return (
                    <tr key={m.id}>
                      <td className="index-col">{i + 1}</td>
                      <td className="medicine-name-col">
                        <strong>{m.name}</strong>
                      </td>
                      <td>
                        <span className="category-pill">
                          {m.categoryName || m.category?.name || "-"}
                        </span>
                      </td>
                      <td>
                        <div className={`stock-badge ${stockStatus}`}>
                           {totalStock} <span>In Stock</span>
                        </div>
                      </td>
                      <td className="text-right price-col">
                        ৳ {sellPrice.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default InventoryReadOnly;