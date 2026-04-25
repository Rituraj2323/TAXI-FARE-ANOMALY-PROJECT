import React from 'react';

export default function MetricCard({ title, value, icon, trend, trendType = 'neutral', color = 'blue', loading }) {
  const gradients = {
    blue:   'linear-gradient(135deg,#3b82f6,#6366f1)',
    rose:   'linear-gradient(135deg,#f43f5e,#ec4899)',
    green:  'linear-gradient(135deg,#10b981,#06b6d4)',
    amber:  'linear-gradient(135deg,#f59e0b,#f97316)',
    purple: 'linear-gradient(135deg,#8b5cf6,#6366f1)',
  };
  const bgColors = {
    blue:   'rgba(59,130,246,0.12)',
    rose:   'rgba(244,63,94,0.12)',
    green:  'rgba(16,185,129,0.12)',
    amber:  'rgba(245,158,11,0.12)',
    purple: 'rgba(139,92,246,0.12)',
  };
  const trendColors = { up: 'var(--accent-rose)', down: 'var(--accent-green)', neutral: 'var(--text-muted)' };
  const trendIcons  = { up: '↑', down: '↓', neutral: '→' };

  return (
    <div className="metric-card fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      
      {/* Background Glow Burst Specific To This Card's Theme */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-10%',
        width: '120px', height: '120px',
        background: gradients[color] || gradients.blue,
        filter: 'blur(60px)', opacity: 0.35, pointerEvents: 'none'
      }} />

      {/* Glow accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: gradients[color] || gradients.blue, borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }} />

      <div className="metric-icon" style={{ background: bgColors[color] || bgColors.blue }}>
        <span style={{ fontSize: '1.3rem' }}>{icon}</span>
      </div>

      {loading ? (
        <>
          <div className="skeleton" style={{ height: 30, width: '60%', marginBottom: 6 }} />
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </>
      ) : (
        <>
          <div className="metric-value" style={{ 
            background: gradients[color], 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontSize: 'clamp(1.4rem, 2vw, 2rem)', /* Prevents clipping */
            wordBreak: 'break-all',
            paddingBottom: '2px' /* Fixes bottom clipping of g/y on gradients */
          }}>
            {value ?? '—'}
          </div>
          <div className="metric-label">{title}</div>
          {trend && (
            <div className="metric-trend" style={{ color: trendColors[trendType] }}>
              <span>{trendIcons[trendType]}</span>
              <span>{trend}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
