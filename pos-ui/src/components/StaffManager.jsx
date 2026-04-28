import { useEffect, useState } from 'react';
import api from '../services/api';
import '../styles/staff.css';

function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [editing, setEditing] = useState(null);
  
  // NEW: Status Notification State
  const [status, setStatus] = useState({ text: '', type: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Helper to trigger notifications
  const triggerStatus = (text, type = 'success') => {
    setStatus({ text, type });
    setTimeout(() => setStatus({ text: '', type: '' }), 3000);
  };

  const loadStaff = async () => {
    try {
      const res = await api.get('/staff');
      setStaff(res.data.staff);
    } catch (err) {
      console.error("Failed to load personnel data.");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const createStaff = async () => {
    if (!name || !username || !password) {
      triggerStatus('All fields are required for enrollment', 'error');
      return;
    }

    try {
      await api.post('/auth/create', { name, username, password, role });
      setName('');
      setUsername('');
      setPassword('');
      setRole('ADMIN');
      loadStaff();
      triggerStatus('System Access Authorized Successfully');
    } catch (err) {
      triggerStatus('Enrollment failed. Please check credentials.', 'error');
    }
  };

  const removeStaff = async (id) => {
    if (!confirm('Are you sure you want to remove access for this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      loadStaff();
      triggerStatus('Account Deactivated Successfully', 'delete');
    } catch (err) {
      triggerStatus('Failed to remove personnel.', 'error');
    }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/staff/${editing.id}`, {
        role: editing.role,
        password: editing.password || undefined
      });
      setEditing(null);
      loadStaff();
      triggerStatus('Profile Synchronization Complete');
    } catch (err) {
      triggerStatus('Update failed. Try again.', 'error');
    }
  };

  return (
    <div className="staff-page">
      {/* STATUS NOTIFICATION TOAST */}
      {status.text && (
        <div className={`status-toast ${status.type}`}>
          <span className="toast-icon">
            {status.type === 'error' ? '⚠️' : status.type === 'delete' ? '🗑️' : '✅'}
          </span>
          {status.text}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="page-header-section">
        <h2>Human Resource & Access Control</h2>
        <p className="subtitle-text">
          Securely manage team credentials, role-based permissions, and administrative access for OnePoint Pharma.
        </p>
      </div>

      {/* ENROLLMENT CARD (CREATE) */}
      <div className="card onboard-card">
        <div className="card-header-flex">
          <span className="icon">🛡️</span>
          <div className="header-text-combo">
            <h3>System Access Enrollment</h3>
            <p className="card-subtitle">Register new onepoint staff and assign security protocols.</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="input-wrapper">
            <label>Full Name</label>
            <input placeholder="Ex: Makin Sarker" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="input-wrapper">
            <label>System Username</label>
            <input placeholder="username_pharma" value={username} onChange={e => setUsername(e.target.value)} />
          </div>

          <div className="input-wrapper">
            <label>Access Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="input-wrapper">
            <label>Designated Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="ADMIN">Administrator</option>
              <option value="PHARMACIST">Pharmacist</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-primary" onClick={createStaff}>
            Authorize Account
          </button>
        </div>
      </div>

      {/* STAFF DIRECTORY (LIST) */}
      <div className="card">
        <div className="card-header-flex">
          <span className="icon">📋</span>
          <h3>Active Personnel Directory</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong></td>
                <td>{s.username}</td>
                <td>
                  <span className={`badge ${s.role.toLowerCase()}`}>
                    {s.role}
                  </span>
                </td>
                <td>
                  {s.id !== currentUser?.id && s.role !== 'OWNER' && (
                    <>
                      <button className="btn-edit" onClick={() => setEditing({ ...s, password: '' })}>Edit</button>
                      <button className="btn-danger" onClick={() => removeStaff(s.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL (CENTERED) */}
      {editing && (
        <div className="modal-bg">
          <div className="staff-edit-modal">
            <div className="modal-header">
              <div className="header-icon">🩺</div>
              <h3>Update Personnel Permissions</h3>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>Access Role</label>
                <select 
                  className="medical-select"
                  value={editing.role} 
                  onChange={e => setEditing({ ...editing, role: e.target.value })}
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="PHARMACIST">Pharmacist</option>
                </select>
              </div>

              <div className="input-group">
                <label>Security: Reset Password</label>
                <input
                  className="medical-input"
                  type="password"
                  placeholder="Enter new secure password"
                  onChange={e => setEditing({ ...editing, password: e.target.value })}
                />
                <small className="input-hint">Leave blank to maintain existing password</small>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn-save-medical" onClick={saveEdit}>Update Permissions</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManager;