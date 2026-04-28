import { useState } from 'react';
import api from '../services/api';
import { notifySuccess, notifyError } from "../utils/notify"; // Import your utility
import "../styles/inventory.css";

function AddMedicine() {
  const [form, setForm] = useState({ name: '', categoryId: '', supplierId: '', barcode: '' });

  const submit = async () => {
    try {
      await api.post('/medicines', {
        ...form,
        categoryId: Number(form.categoryId),
        supplierId: Number(form.supplierId)
      });
      // ✅ Professional OnePoint Notification
      notifySuccess(`${form.name} added to inventory successfully`);
      setForm({ name: '', categoryId: '', supplierId: '', barcode: '' }); // Clear form
    } catch (err) {
      notifyError("Failed to add medicine. Check database connection.");
    }
  };

  return (
    <div className="card medicine-form-container">
      <h2 className="form-title">New Medicine Registration</h2>
      <div className="form-grid">
        <div className="input-group">
          <label>Generic/Brand Name</label>
          <input className="input" value={form.name} placeholder="e.g. Napa Extend" onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Category ID</label>
          <input className="input" value={form.categoryId} placeholder="Select Category" onChange={e => setForm({ ...form, categoryId: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Supplier ID</label>
          <input className="input" value={form.supplierId} placeholder="Select Supplier" onChange={e => setForm({ ...form, supplierId: e.target.value })} />
        </div>
        <div className="input-group">
          <label>Barcode</label>
          <input className="input" value={form.barcode} placeholder="Scan Barcode" onChange={e => setForm({ ...form, barcode: e.target.value })} />
        </div>
      </div>
      <button className="btn-success mt-3" onClick={submit}>Secure Save</button>
    </div>
  );
}

export default AddMedicine;