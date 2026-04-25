import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { API } from '../config';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e, forceMode) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const activeMode = forceMode || mode;
    
    try {
      const endpoint = activeMode === 'login' ? '/auth/login' : '/auth/register';
      const body = activeMode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      login(data.user, data.access);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card fade-in" style={{ padding: '40px 48px', overflow: 'hidden' }}>
        
        {/* Header Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
          <div className="login-logo" style={{ margin: 0, width: 48, height: 48, fontSize: '1.4rem' }}>🚖</div>
          <div style={{ textAlign: 'left' }}>
            <h1 className="login-title" style={{ fontSize: '1.6rem', textAlign: 'left' }}>TaxiGuard AI</h1>
            <p className="login-subtitle" style={{ margin: 0, fontSize: '0.8rem' }}>Anomaly Intelligence</p>
          </div>
        </div>

        {/* ─── Passenger Checker Prompt ─── */}
        <div style={{ 
          width: '100%', marginBottom: 30, textAlign: 'center', 
          background: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-glass)'
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: '0.85rem', fontFamily: 'Outfit', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Public Portal</p>
          <button
            onClick={() => navigate('/passenger')}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              color: 'white', fontSize: '1rem', fontWeight: 700, fontFamily: 'Outfit',
              cursor: 'pointer', boxShadow: 'var(--shadow-btn)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(6, 182, 212, 0.5)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-btn)'; }}
          >
            <span style={{ fontSize: '1.2rem' }}>🚖</span> Passenger Fare Checker
          </button>
        </div>

        <div className="login-divider" style={{ marginBottom: 20, fontSize: '0.75rem' }}>STAFF & ADMIN ACCESS</div>

        {/* ─── Sliding Tab Bar ─── */}
        <div className="tab-bar" style={{ position: 'relative', display: 'flex', padding: '6px' }}>
          <div style={{
            position: 'absolute', top: 6, bottom: 6, width: 'calc(50% - 6px)',
            left: mode === 'login' ? '6px' : '50%',
            background: 'rgba(255,255,255,0.1)', borderRadius: '8px',
            transition: 'left 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: 'var(--shadow-glass)', border: '1px solid rgba(255,255,255,0.05)',
            zIndex: 0
          }} />
          <button 
            className="tab-btn" 
            style={{ zIndex: 1, color: mode === 'login' ? 'white' : 'var(--text-secondary)' }} 
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className="tab-btn" 
            style={{ zIndex: 1, color: mode === 'register' ? 'white' : 'var(--text-secondary)' }} 
            onClick={() => { setMode('register'); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* ─── Sliding Forms Container ─── */}
        <div style={{ position: 'relative', overflow: 'hidden', width: '100%', marginTop: 24, paddingBottom: 10 }}>
          <div style={{
            display: 'flex', width: '200%',
            transform: mode === 'login' ? 'translateX(0)' : 'translateX(-50%)',
            transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.3, 1)'
          }}>

            {/* LOGIN FORM (Left Panel) */}
            <div style={{ width: '50%', flexShrink: 0, paddingRight: '20px' }}>
              <form className="login-form" style={{ marginTop: 0 }} onSubmit={(e) => submit(e, 'login')}>
                <div className="form-group">
                  <label className="input-label">Email Address</label>
                  <input className="input" type="email" name="email" placeholder="admin@taxiguard.ai" value={form.email} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label className="input-label">Password</label>
                  <input className="input" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required />
                </div>

                <button className="btn btn-ghost w-full" type="submit" disabled={loading} style={{ marginTop: 8, background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  {loading && mode === 'login' ? <span className="spinner" /> : null}
                  {loading && mode === 'login' ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            </div>

            {/* REGISTER FORM (Right Panel) */}
            <div style={{ width: '50%', flexShrink: 0, paddingLeft: '20px' }}>
              <form className="login-form" style={{ marginTop: 0 }} onSubmit={(e) => submit(e, 'register')}>
                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <input className="input" type="text" name="name" placeholder="Analyst Name" value={form.name} onChange={handle} required={mode === 'register'} />
                </div>
                <div className="form-group">
                  <label className="input-label">Email Address</label>
                  <input className="input" type="email" name="email" placeholder="you@taxiguard.ai" value={form.email} onChange={handle} required={mode === 'register'} />
                </div>
                <div className="form-group">
                  <label className="input-label">Password</label>
                  <input className="input" type="password" name="password" placeholder="Min 8 characters" value={form.password} onChange={handle} required={mode === 'register'} />
                </div>

                <button className="btn btn-ghost w-full" type="submit" disabled={loading} style={{ marginTop: 8, background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                  {loading && mode === 'register' ? <span className="spinner" /> : null}
                  {loading && mode === 'register' ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>

          </div>
        </div>

        {error && (
          <div className="login-error fade-in" style={{ marginTop: 16 }}>
            ⚠️ {error}
          </div>
        )}

      </div>
    </div>
  );
}
