import { useState } from 'react';
import api from '../services/api';
import { notifySuccess, notifyError } from "../utils/notify";
import "../styles/inventory.css";

function AddBatch() {
  const [form, setForm] = useState({ medicineId: '', batchNo: '', expiryDate: '', buyPrice: '', sellPrice: '', quantity: '' });

  const submit = async () => {
    try {
      await api.post('/batches', {
        ...form,
        medicineId: Number(form.medicineId),
        buyPrice: Number(form.buyPrice),
        sellPrice: Number(form.sellPrice),
        quantity: Number(form.quantity)
      });
      notifySuccess(`Batch ${form.batchNo} recorded successfully`);
      setForm({ medicineId: '', batchNo: '', expiryDate: '', buyPrice: '', sellPrice: '', quantity: '' });
    } catch (err) {
      notifyError("Batch entry failed");
    }
  };

  return (
    <div className="card batch-form-container">
      <h2 className="form-title">Stock Batch Entry</h2>
      <div className="form-grid">
        <input className="input" value={form.medicineId} placeholder="Medicine ID" onChange={e => setForm({ ...form, medicineId: e.target.value })} />
        <input className="input" value={form.batchNo} placeholder="Batch No (e.g. B-204)" onChange={e => setForm({ ...form, batchNo: e.target.value })} />
        <input type="date" className="input" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
        <input className="input" value={form.buyPrice} placeholder="Buying Price" onChange={e => setForm({ ...form, buyPrice: e.target.value })} />
        <input className="input" value={form.sellPrice} placeholder="Selling Price" onChange={e => setForm({ ...form, sellPrice: e.target.value })} />
        <input className="input" value={form.quantity} placeholder="Unit Quantity" onChange={e => setForm({ ...form, quantity: e.target.value })} />
      </div>
      <button className="btn-success mt-3" onClick={submit}>Update Stock</button>
    </div>
  );
}

export default AddBatch;