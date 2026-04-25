import React from 'react';

export default function FilterPanel({ filters, onChange, onReset }) {
  const handle = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="filter-bar fade-in">
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', flexShrink: 0 }}>
        🔽 Filters
      </span>

      <div className="filter-group">
        <div className="filter-label">Date From</div>
        <input type="date" className="filter-input"
          value={filters.dateFrom || ''} onChange={e => handle('dateFrom', e.target.value)} />
      </div>

      <div className="filter-group">
        <div className="filter-label">Date To</div>
        <input type="date" className="filter-input"
          value={filters.dateTo || ''} onChange={e => handle('dateTo', e.target.value)} />
      </div>

      <div className="filter-group">
        <div className="filter-label">Min Fare ($)</div>
        <input type="number" className="filter-input" placeholder="0"
          value={filters.minFare || ''} onChange={e => handle('minFare', e.target.value)} min="0" />
      </div>

      <div className="filter-group">
        <div className="filter-label">Max Fare ($)</div>
        <input type="number" className="filter-input" placeholder="500"
          value={filters.maxFare || ''} onChange={e => handle('maxFare', e.target.value)} min="0" />
      </div>

      <div className="filter-group">
        <div className="filter-label">Zone</div>
        <select className="filter-input" value={filters.zone || 'all'} onChange={e => handle('zone', e.target.value)}>
          <option value="all">All Zones</option>
          <option value="NYC">NYC</option>
          <option value="Manhattan">Manhattan</option>
          <option value="Brooklyn">Brooklyn</option>
          <option value="Queens">Queens</option>
        </select>
      </div>

      <div style={{ marginLeft: 'auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={onReset}>✕ Reset</button>
      </div>
    </div>
  );
}
