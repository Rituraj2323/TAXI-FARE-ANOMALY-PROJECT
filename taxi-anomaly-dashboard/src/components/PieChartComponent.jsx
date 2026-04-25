import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API } from '../config';
const COLORS = ['#10b981', '#f43f5e'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-light)',
      borderRadius: 10, padding: '10px 14px', fontSize: '0.78rem',
      boxShadow: 'var(--shadow-lg)',
    }}>
      <p style={{ color: payload[0].payload.fill !== '#f43f5e' ? '#34d399' : '#fb7185', fontWeight: 700 }}>
        {payload[0].name}: {payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  ) : null;
};

export default function DistributionPieChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/anomalies/distribution`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
    </div>
  );

  if (!data.length) return (
    <div className="empty-state"><div className="empty-state-icon">🥧</div><div className="empty-state-text">No data</div></div>
  );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data} cx="50%" cy="45%"
          innerRadius={55} outerRadius={85}
          dataKey="value" nameKey="name"
          labelLine={false} label={renderCustomLabel}
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{value}</span>}
          iconType="circle" iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
