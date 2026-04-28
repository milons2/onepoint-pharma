import { useEffect, useState } from "react";
import api from "../services/api";
import "../styles/inventory.css";
import { notifySuccess, notifyError } from "../utils/notify";
import SearchableSelect from "../components/SearchableSelect";
import { 
  Search, Edit3, Trash2, Package, XCircle, 
  Calendar, Tag, TrendingUp, Layers, CheckCircle 
} from "lucide-react";

function Inventory() {
  // --- Data State ---
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  
  // --- UI State ---
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- Form States ---
  const [medForm, setMedForm] = useState({ name: "", categoryId: "", supplierId: "", barcode: "" });
  const [batchForm, setBatchForm] = useState({ batchNo: "", expiryDate: "", buyPrice: "", sellPrice: "", quantity: "" });

  useEffect(() => {
    loadAll();
  }, []);

  // --- Functions ---
  async function loadAll() {
    try {
      const [m, c, s] = await Promise.all([
        api.get("/medicines"),
        api.get("/categories"),
        api.get("/suppliers")
      ]);
      setMedicines(m.data.medicines || []);
      setCategories(c.data.categories || []);
      setSuppliers(s.data.suppliers || []);
    } catch {
      notifyError("Inventory load failed");
    }
  }

  function resetMedicineForm() {
    setMedForm({ name: "", categoryId: "", supplierId: "", barcode: "" });
  }

  async function selectMedicine(med) {
    try {
      // Prevent crash by initializing empty batches
      setSelectedMedicine({ ...med, batches: [] });
      const res = await api.get(`/batches/medicine/${med.id}`);
      setSelectedMedicine({ ...med, batches: res.data.batches || [] });
      
      // Auto-fill medicine form for potential editing
      setMedForm({
        name: med.name,
        categoryId: med.categoryId,
        supplierId: med.supplierId,
        barcode: med.barcode || ""
      });
    } catch {
      notifyError("Failed to load batches");
    }
  }

  async function addMedicine() {
    if (!medForm.name || !medForm.categoryId || !medForm.supplierId) {
      return notifyError("All fields required");
    }
    try {
      await api.post("/medicines", {
        ...medForm,
        categoryId: Number(medForm.categoryId),
        supplierId: Number(medForm.supplierId)
      });
      notifySuccess(`${medForm.name} added to OnePoint`);
      resetMedicineForm();
      loadAll();
    } catch {
      notifyError("Add medicine failed");
    }
  }

  async function updateMedicine() {
    if (!selectedMedicine) return;
    try {
      await api.put(`/medicines/${selectedMedicine.id}`, {
        ...medForm,
        categoryId: Number(medForm.categoryId),
        supplierId: Number(medForm.supplierId)
      });
      notifySuccess("Medicine updated successfully");
      
      // RESET TO ADD MODE
      setSelectedMedicine(null);
      resetMedicineForm();
      loadAll();
    } catch {
      notifyError("Update failed");
    }
  }

  async function deleteMedicine(id) {
    if (!confirm("Deactivate this medicine?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      notifySuccess("Medicine removed");
      setSelectedMedicine(null);
      resetMedicineForm();
      loadAll();
    } catch {
      notifyError("Action failed");
    }
  }

  async function addBatch() {
    if (!selectedMedicine) return;
    try {
      await api.post("/batches", {
        medicineId: selectedMedicine.id,
        ...batchForm,
        buyPrice: Number(batchForm.buyPrice),
        sellPrice: Number(batchForm.sellPrice),
        quantity: Number(batchForm.quantity)
      });
      notifySuccess("Batch added");
      setBatchForm({ batchNo: "", expiryDate: "", buyPrice: "", sellPrice: "", quantity: "" });
      selectMedicine(selectedMedicine);
    } catch {
      notifyError("Batch add failed");
    }
  }

  async function updateBatch() {
    try {
      await api.put(`/batches/${editingBatch.id}`, {
        ...editingBatch,
        buyPrice: Number(editingBatch.buyPrice),
        sellPrice: Number(editingBatch.sellPrice),
        quantity: Number(editingBatch.quantity)
      });
      notifySuccess("Batch updated");
      setEditingBatch(null);
      selectMedicine(selectedMedicine);
    } catch {
      notifyError("Update batch failed");
    }
  }

  async function deleteBatch(id) {
    if (!confirm("Delete batch?")) return;
    try {
      await api.delete(`/batches/${id}`);
      notifySuccess("Batch deleted");
      selectMedicine(selectedMedicine);
    } catch {
      notifyError("Delete failed");
    }
  }

  // Filter medicines based on search
  const filteredMedicines = medicines
  .filter(m => m.isActive !== false)
  .sort((a, b) => b.id - a.id)
  .filter(m => {
    if (!searchTerm) return true;
    return (
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.barcode?.includes(searchTerm)
    );
  })
  .slice(0, searchTerm ? undefined : 7);


  return (
    <div className="inventory-page">
      <div className="inventory-header-top">
        <h2>Inventory Management</h2>
        <p className="subtitle">OnePoint Pharma • Stock Control System</p>
      </div>

      {/* TOP CARD: ADD/EDIT MEDICINE */}
      <div className="card medicine-entry-card">
        <div className="form-header-row">
          <h3 className="form-title">
            {selectedMedicine ? `Editing: ${selectedMedicine.name}` : "Register New Medicine"}
          </h3>
          {selectedMedicine && (
            <button className="btn-cancel" onClick={() => { setSelectedMedicine(null); resetMedicineForm(); }}>
              <XCircle size={14} /> Exit Edit Mode
            </button>
          )}
        </div>
        
        <div className="form-grid inventory-form-safe">
          {/* Medicine Name */}
          <div className="field">
            <label>Medicine Name</label>
            <input
              placeholder="Enter name"
              value={medForm.name}
              onChange={(e) =>
                setMedForm({ ...medForm, name: e.target.value })
              }
            />
          </div>

          {/* Category */}
          <SearchableSelect
            label="Category"
            options={categories}
            value={medForm.categoryId}
            onChange={(id) =>
              setMedForm({ ...medForm, categoryId: id })
            }
            placeholder="Select Category"
          />

          {/* Supplier */}
          <SearchableSelect
            label="Supplier"
            options={suppliers}
            value={medForm.supplierId}
            onChange={(id) =>
              setMedForm({ ...medForm, supplierId: id })
            }
            placeholder="Select Supplier"
          />


          {/* Barcode */}
          <div className="field">
            <label>Barcode</label>
            <input
              placeholder="Optional Barcode"
              value={medForm.barcode}
              onChange={(e) =>
                setMedForm({ ...medForm, barcode: e.target.value })
              }
            />
          </div>

          {/* Action */}
          <div className="field action-field">
            <button
              className={selectedMedicine ? "btn-success full-w" : "btn-primary full-w"}
              onClick={selectedMedicine ? updateMedicine : addMedicine}
            >
              {selectedMedicine ? "Update Medicine" : "Register Medicine"}
            </button>
          </div>
        </div>

      </div>

      <div className="inventory-layout">
        {/* LEFT: MASTER LIST */}
        <aside className="card list-aside">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Filter list..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="medicine-list-header">
            <small className="recent-label">
              {searchTerm ? "Search results" : "Recently added"}
            </small>
          </div>
          <ul className="medicine-list">
            {filteredMedicines.map(m => (
              <li key={m.id} className={selectedMedicine?.id === m.id ? "active" : ""} onClick={() => selectMedicine(m)}>
                <div className="med-info-wrapper">
                  <span className="med-name">{m.name}</span>
                  <span className="med-cat-badge">{m.category?.name || "General"}</span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* RIGHT: BATCH DETAILS */}
        {/* RIGHT: BATCH DETAILS */}
        <main className="card batch-main">
          {!selectedMedicine ? (
            <div className="empty-state">
              <Package size={50} strokeWidth={1} />
              <p>Select a medicine from the sidebar <br/> to view or add stock batches.</p>
            </div>
          ) : (
    <>
      <div className="header-row">
        {/* Navy Color & Uppercase Medicine Name */}
        <h3 className="selected-med-title">
          {selectedMedicine.name} <small>Stock</small>
        </h3>
        <button className="btn-danger-outline" onClick={() => deleteMedicine(selectedMedicine.id)}>
           <Trash2 size={14} /> Deactivate
        </button>
      </div>

      {selectedMedicine.batches && selectedMedicine.batches.length > 0 ? (
        <div className="table-wrapper">
          <table className="onepoint-table">
            <thead>
              <tr>
                <th>Batch No</th>
                <th>Expiry</th>
                <th>Buy (BDT)</th>
                <th>Sell (BDT)</th>
                <th>Qty</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {selectedMedicine.batches.map(b => (
                <tr key={b.id}>
                  <td><b>{b.batchNo}</b></td>
                  <td>{new Date(b.expiryDate).toLocaleDateString()}</td>
                  <td className="buy-price-cell">৳ {b.buyPrice}</td>
                  <td className="sell-price-cell">৳ {b.sellPrice}</td>
                  <td className={b.quantity < 10 ? "low-stock" : ""}>{b.quantity}</td>
                  <td className="table-actions">
                     <button className="icon-btn" onClick={() => setEditingBatch(b)}><Edit3 size={14} /></button>
                     <button className="icon-btn danger" onClick={() => deleteBatch(b.id)}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-batches">
          <p>No active stock for this medicine. Add first batch below.</p>
        </div>
      )}

      {/* QUICK ADD SECTION WITH ICONS */}
      <div className="batch-entry-footer">
        <h4 className="section-divider">Quick Add Stock</h4>
        <div className="batch-form-grid">
          <div className="input-field">
            <label><Package size={13} /> Batch No</label>
            <input placeholder="e.g. B-101" value={batchForm.batchNo} onChange={e => setBatchForm({...batchForm, batchNo: e.target.value})} />
          </div>
          <div className="input-field">
            <label><Calendar size={13} /> Expiry</label>
            <input type="date" value={batchForm.expiryDate} onChange={e => setBatchForm({...batchForm, expiryDate: e.target.value})} />
          </div>
          <div className="input-field">
            <label><Tag size={13} /> Buy Price</label>
            <input placeholder="0.00" value={batchForm.buyPrice} onChange={e => setBatchForm({...batchForm, buyPrice: e.target.value})} />
          </div>
          <div className="input-field">
            <label><TrendingUp size={13} /> Sell Price</label>
            <input placeholder="0.00" value={batchForm.sellPrice} onChange={e => setBatchForm({...batchForm, sellPrice: e.target.value})} />
          </div>
          <div className="input-field">
            <label><Layers size={13} /> Quantity</label>
            <input placeholder="Units" value={batchForm.quantity} onChange={e => setBatchForm({...batchForm, quantity: e.target.value})} />
          </div>
          <div className="input-field action-bottom">
            <button className="btn-success" onClick={addBatch}>
              <CheckCircle size={16} style={{marginRight: '8px'}} /> Add Stock Batch
            </button>
          </div>
        </div>
      </div>
    </>
  )}
</main>    

</div>

      {/* EDIT BATCH MODAL */}
    {editingBatch && (
      <div className="modal">
        <div className="branded-modal">
          <div className="modal-header">
            <h3>Update Batch Stock</h3>
            <p className="modal-subtitle">OnePoint Inventory Control</p>
          </div>
          
          <div className="modal-form-vertical">
            <div className="field">
              <label><Package size={14} /> Batch Number</label>
              <input 
                value={editingBatch.batchNo} 
                onChange={e => setEditingBatch({ ...editingBatch, batchNo: e.target.value })} 
              />
            </div>

            <div className="field">
              <label><Calendar size={14} /> Expiry Date</label>
              <input 
                type="date" 
                value={editingBatch.expiryDate?.split("T")[0] || ""} 
                onChange={e => setEditingBatch({ ...editingBatch, expiryDate: e.target.value })} 
              />
            </div>

            <div className="field">
              <label><Tag size={14} /> Buy Price (৳)</label>
              <input 
                className="buy-input" 
                value={editingBatch.buyPrice} 
                onChange={e => setEditingBatch({ ...editingBatch, buyPrice: e.target.value })} 
              />
            </div>

            <div className="field">
              <label><TrendingUp size={14} /> Sell Price (৳)</label>
              <input 
                className="sell-input" 
                value={editingBatch.sellPrice} 
                onChange={e => setEditingBatch({ ...editingBatch, sellPrice: e.target.value })} 
              />
            </div>

            <div className="field">
              <label><Layers size={14} /> Current Quantity</label>
              <input 
                value={editingBatch.quantity} 
                onChange={e => setEditingBatch({ ...editingBatch, quantity: e.target.value })} 
              />
            </div>
          </div>

          <div className="modal-actions-vertical">
            <button className="btn-success" onClick={updateBatch}>
              <CheckCircle size={18} style={{marginRight: '8px'}} /> Save Updates
            </button>
            <button className="btn-cancel" onClick={() => setEditingBatch(null)}>
              Discard Changes
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default Inventory;