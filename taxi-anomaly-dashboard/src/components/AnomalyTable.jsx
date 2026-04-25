import React, { useEffect, useState, useCallback } from 'react';
import { API } from '../config';

function ScoreBar({ score }) {
  // score is 0-100%
  const normalized = Math.min(1, Math.max(0, score / 100));
  const color = score >= 85 ? 'var(--accent-rose)' : score >= 50 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${normalized * 100}%`, background: color }} />
      </div>
      <span style={{ fontSize: '0.8rem', color, minWidth: 50, textAlign: 'right', fontWeight: 700, fontFamily: 'Outfit' }}>
        {score?.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AnomalyTable({ filters }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('anomaly_score');
  const [jumpPage, setJumpPage] = useState('');
  const pageSize = 50;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: pageSize });
      if (filters?.minFare) params.set('min_fare', filters.minFare);
      if (filters?.maxFare) params.set('max_fare', filters.maxFare);
      if (filters?.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters?.dateTo)   params.set('date_to',   filters.dateTo);
      if (filters?.zone && filters.zone !== 'all') params.set('zone', filters.zone);

      const res = await fetch(`${API}/anomalies?${params}`);
      const data = await res.json();
      setRows(data.results || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { setPage(1); }, [filters]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(total / pageSize);
  const goToPage = (p) => setPage(Math.min(totalPages, Math.max(1, p)));

  const sortedRows = [...rows].sort((a, b) => {
    if (sortBy === 'anomaly_score') return b.anomaly_score - a.anomaly_score; // highest % first
    if (sortBy === 'fare_amount')   return b.fare_amount - a.fare_amount;
    if (sortBy === 'distance_km')   return b.distance_km - a.distance_km;
    return 0;
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Anomaly Table</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
            {total.toLocaleString()} total anomalies
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sort by:</span>
          {['anomaly_score', 'fare_amount', 'distance_km'].map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`btn btn-ghost btn-sm`}
              style={sortBy === s ? { borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' } : {}}
            >
              {s === 'anomaly_score' ? 'Score' : s === 'fare_amount' ? 'Fare' : 'Distance'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Trip ID</th>
              <th>Date</th>
              <th>Fare (USD)</th>
              <th>Distance (km)</th>
              <th>Duration (min)</th>
              <th>Fare/km</th>
              <th>Anomaly Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>
                  ))}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-text">No anomalies match your filters</div>
                  </div>
                </td>
              </tr>
            ) : sortedRows.map((row, i) => (
              <tr key={row.anomaly_id || i}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  {row.ride_id?.slice(0, 13)}…
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.pickup_date || '—'}</td>
                <td style={{ fontWeight: 600 }}>${row.fare_amount?.toFixed(2)}</td>
                <td>{row.distance_km?.toFixed(2)}</td>
                <td>{row.trip_duration_min?.toFixed(1)}</td>
                <td style={{ color: row.fare_per_km > 10 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                  ${row.fare_per_km?.toFixed(2)}
                </td>
                <td style={{ minWidth: 150 }}><ScoreBar score={row.anomaly_score} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Page {page} of {totalPages.toLocaleString()} &nbsp;·&nbsp; {total.toLocaleString()} anomalies
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(1)} disabled={page <= 1}>«</button>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>← Prev</button>
            <input
              type="number" min={1} max={totalPages} placeholder="Go to..."
              value={jumpPage}
              onChange={e => setJumpPage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { goToPage(parseInt(jumpPage)); setJumpPage(''); } }}
              style={{ width: 80, padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: 8, color: 'white', fontSize: '0.8rem', outline: 'none', fontFamily: 'Outfit' }}
            />
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next →</button>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(totalPages)} disabled={page >= totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
