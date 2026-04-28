import { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Pill, Lock, HelpCircle } from 'lucide-react';
import '../styles/login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;

      const normalizedUser = {
        ...user,
        role: user.role.toUpperCase(),
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      navigate('/dashboard');
    } catch (err) {
      setError('Access Denied: Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* LEFT SIDE: BRAND EXPERIENCE */}
      <div className="login-brand-side">
        <div className="brand-content">
          <div className="brand-logo-large">
            <Pill size={48} color="#00a896" />
            <span>OnePoint</span>
          </div>
          <h1>Pharmaceutical Management Standard</h1>
          <p>Ensuring precision, security, and efficiency in medical retail operations.</p>
          
          <div className="feature-badges">
            <div className="badge"><ShieldCheck size={16}/> Enterprise Security</div>
            <div className="badge"><Lock size={16}/> System Encrypted</div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: LOGIN FORM */}
      <div className="login-form-side">
        <div className="login-box">
          <h2>Welcome Back</h2>
          <p className="subtitle">Authorized Access Only</p>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Enter username" 
                required 
                onChange={e => setUsername(e.target.value)} 
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>

            {error && <div className="login-error-msg">{error}</div>}

            <button type="submit" className="login-main-btn" disabled={loading}>
              {loading ? "Verifying..." : "Secure Login"}
            </button>
          </form>

          {/* PROFESSIONAL SUPPORT LINK BELOW BUTTON */}
          <div className="login-support">
            <p>
              <HelpCircle size={12} strokeWidth={2.5} /> 
              Access issues? <span>Contact System Administrator</span>
            </p>
          </div>

          <div className="login-footer">
            <span>© 2026 OnePoint Pharma Solutions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;