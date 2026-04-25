import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const navItems = [
  { icon: '📊', label: 'Dashboard', path: '/' },
  { icon: '🚨', label: 'Anomalies', path: '/?tab=anomalies' },
  { icon: '🏆', label: 'Top-K Alerts', path: '/?tab=topk' },
  { icon: '🚖', label: 'All Trips', path: '/?tab=trips' },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-icon">🚖</div>
        <div>
          <div className="sidebar-title">TaxiGuard AI</div>
          <div className="sidebar-subtitle">Anomaly Detection</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>

        {[
          { icon: '📊', label: 'Overview', id: 'overview' },
          { icon: '🚨', label: 'Anomalies', id: 'anomalies' },
          { icon: '🏆', label: 'Top-K Alerts', id: 'topk' },
          { icon: '🚖', label: 'All Trips', id: 'trips' },
        ].map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: 'transparent' }}
            onClick={() => onTabChange(item.id)}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}


      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.name || user?.email || 'User'}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || ''}
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Sign out"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', padding: 4, borderRadius: 6, transition: 'color 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          ↪
        </button>
      </div>
    </aside>
  );
}
