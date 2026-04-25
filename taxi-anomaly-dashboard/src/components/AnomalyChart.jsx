import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { API } from '../config';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem', minWidth: 150,
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          {p.name === 'Anomaly Rate' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

export default function TrendLineChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/anomalies/chart-data`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const formatted = data.map(d => ({
    ...d,
    label: d.date ? d.date.slice(5) : '',  // "02-01"
  }));

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!data.length) return (
    <div className="empty-state">
      <div className="empty-state-icon">📈</div>
      <div className="empty-state-text">No chart data available</div>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={formatted} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradRate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradFare" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="label" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area dataKey="anomaly_rate" name="Anomaly Rate" type="monotone"
          stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradRate)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
        <Area dataKey="anomalies" name="Anomalies" type="monotone"
          stroke="#f43f5e" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} activeDot={{ r: 3, fill: '#f43f5e' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
