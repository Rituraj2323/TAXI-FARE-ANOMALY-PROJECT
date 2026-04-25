import React, { useEffect, useState } from 'react';
import { API } from '../config';

function RankBadge({ rank }) {
  const colors = ['#f59e0b', '#94a3b8', '#b45309'];
  return rank <= 3 ? (
    <span style={{ fontSize: '1rem' }}>{['🥇','🥈','🥉'][rank - 1]}</span>
  ) : (
    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{rank}</span>
  );
}

export default function TopKAnomalies() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [k, setK] = useState(20);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/anomalies/topk?k=${k}`)
      .then(r => r.json())
      .then(d => { setData(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [k]);

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">🏆 Top-K Suspicious Trips</div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 3 }}>
            Ranked by anomaly score (most suspicious first)
          </div>
        </div>
        <div className="k-controls">
          <button className="k-btn" onClick={() => setK(k => Math.max(5, k - 5))}>−</button>
          <span className="k-value">K={k}</span>
          <button className="k-btn" onClick={() => setK(k => Math.min(100, k + 5))}>+</button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Trip ID</th>
              <th>Date</th>
              <th>Fare</th>
              <th>Dist (km)</th>
              <th>Fare/km</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: k > 10 ? 10 : k }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 13, width: '75%' }} /></td>
                ))}</tr>
              ))
            ) : data.map((row, i) => {
              const score = row.anomaly_score || 0;
              return (
                <tr key={row.anomaly_id || i}>
                  <td><RankBadge rank={i + 1} /></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                    {row.ride_id?.slice(0, 12)}…
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.pickup_date || '—'}</td>
                  <td style={{ fontWeight: 700 }}>${row.fare_amount?.toFixed(2)}</td>
                  <td>{row.distance_km?.toFixed(2)}</td>
                  <td style={{ color: row.fare_per_km > 10 ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                    ${row.fare_per_km?.toFixed(2)}
                  </td>
                  <td style={{ fontFamily: 'Outfit', fontSize: '0.8rem', color: 'white', fontWeight: 700 }}>
                    {score.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
