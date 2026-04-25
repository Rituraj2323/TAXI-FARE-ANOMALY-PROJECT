import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import MetricCard from '../components/MetricCard';
import AnomalyChart from '../components/AnomalyChart';
import PieChartComponent from '../components/PieChartComponent';
import AnomalyTable from '../components/AnomalyTable';
import TopKAnomalies from '../components/TopKAnomalies';
import FilterPanel from '../components/FilterPanel';
import { useAuth } from '../App';
import { API } from '../config';
const EMPTY_FILTERS = { dateFrom: '', dateTo: '', minFare: '', maxFare: '', zone: 'all' };

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API}/anomalies/stats`);
      const data = await res.json();
      setStats(data);
    } catch (e) {
      console.error('Stats fetch error:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handleRefresh = () => { fetchStats(); setLastRefresh(new Date()); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const name = user?.name || user?.email?.split('@')[0] || 'Analyst';

  return (
    <div className="dashboard-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header fade-in">
          <div>
            <h1 className="dashboard-title">
              {activeTab === 'overview' ? `${greeting()}, ${name} 👋` :
             activeTab === 'anomalies' ? '🚨 Anomaly Explorer' :
             activeTab === 'topk' ? '🏆 Top-K Alerts' : '🚖 All Trips'}
            </h1>
            <p className="dashboard-subtitle">
              {activeTab === 'overview'
                ? 'Real-time taxi anomaly intelligence dashboard'
                : activeTab === 'anomalies'
                ? 'Browse, filter and investigate anomalous trips'
                : activeTab === 'topk'
                ? 'Most suspicious trips ranked by isolation score'
                : 'Complete trip records with anomaly labels'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <div className="pulse-dot" />
              Live · {lastRefresh.toLocaleTimeString()}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={handleRefresh}>↻ Refresh</button>
          </div>
        </div>

        {/* ── Overview Tab ────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="metrics-grid">
              <MetricCard
                title="Total Trips Analyzed" icon="🚖" color="blue" loading={statsLoading}
                value={stats ? stats.total_trips_analyzed.toLocaleString() : null}
                trend="Feb 2023 dataset" trendType="neutral"
              />
              <MetricCard
                title="Anomalies Detected" icon="🚨" color="rose" loading={statsLoading}
                value={stats ? stats.anomalies_detected.toLocaleString() : null}
                trend={stats ? `${stats.anomaly_rate_percent}% of trips` : null} trendType="up"
              />
              <MetricCard
                title="Avg Fare (USD)" icon="💵" color="green" loading={statsLoading}
                value={stats ? `$${stats.avg_fare}` : null}
                trend="Across all trips" trendType="neutral"
              />
              <MetricCard
                title="Active Alerts" icon="⚡" color="amber" loading={statsLoading}
                value={stats ? stats.active_alerts.toLocaleString() : null}
                trend="Requires review" trendType="up"
              />
            </div>

            {/* Charts */}
            <div className="charts-row">
              <div className="chart-card">
                <div className="chart-title">Daily Anomaly Trend</div>
                <div className="chart-subtitle">Anomaly rate (%) and count over time</div>
                <div className="chart-container"><AnomalyChart /></div>
              </div>
              <div className="chart-card">
                <div className="chart-title">Trip Distribution</div>
                <div className="chart-subtitle">Normal vs Anomalous trips</div>
                <div className="chart-container"><PieChartComponent /></div>
              </div>
            </div>

          </>
        )}

        {/* ── Anomalies Tab ────────────────────────────────────── */}
        {activeTab === 'anomalies' && (
          <>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_FILTERS)}
            />
            <div className="card">
              <AnomalyTable filters={filters} />
            </div>
          </>
        )}

        {/* ── Top-K Tab ─────────────────────────────────────────── */}
        {activeTab === 'topk' && (
          <div className="card">
            <TopKAnomalies />
          </div>
        )}

        {/* ── Trips Tab ─────────────────────────────────────────── */}
        {activeTab === 'trips' && (
          <>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(EMPTY_FILTERS)}
            />
            <div className="card">
              <AllTripsTable filters={filters} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ── Inline All Trips Table ───────────────────────────────────────── */
function AllTripsTable({ filters }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [jumpPage, setJumpPage] = useState('');
  const pageSize = 100; // Show 100 records per page

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, page_size: pageSize });
    if (filters?.minFare) params.set('min_fare', filters.minFare);
    if (filters?.maxFare) params.set('max_fare', filters.maxFare);
    if (filters?.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters?.dateTo)   params.set('date_to',   filters.dateTo);

    fetch(`${API}/trips?${params}`)
      .then(r => r.json())
      .then(d => { setRows(d.results || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, filters]);

  const totalPages = Math.ceil(total / pageSize);
  const goToPage = (p) => setPage(Math.min(totalPages, Math.max(1, p)));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>All Trips</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 10 }}>
            {total.toLocaleString()} total records
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'Outfit' }}>
          Showing {((page-1)*pageSize+1).toLocaleString()}–{Math.min(page*pageSize, total).toLocaleString()} of {total.toLocaleString()}
        </div>
      </div>
      <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>Date</th>
              <th>Pickup Time</th>
              <th>Passengers</th>
              <th>Distance (km)</th>
              <th>Duration (min)</th>
              <th>Fare (USD)</th>
              <th>Fare/km</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 15 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => (
                  <td key={j}><div className="skeleton" style={{ height: 13, width: '80%' }} /></td>
                ))}</tr>
              ))
            ) : rows.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon">🔍</div><div className="empty-state-text">No trips found</div></div></td></tr>
            ) : rows.map((row, i) => (
              <tr key={row.ride_id || i}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--accent-cyan)' }}>
                  {row.ride_id?.slice(0, 12)}…
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{row.pickup_date || '—'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {row.pickup_time?.slice(11, 16) || '—'}
                </td>
                <td>{row.passenger_count}</td>
                <td>{row.distance_km?.toFixed(2)}</td>
                <td>{row.trip_duration_min?.toFixed(1)}</td>
                <td style={{ fontWeight: 600 }}>${row.fare_amount?.toFixed(2)}</td>
                <td>${row.fare_per_km?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Page {page} of {totalPages.toLocaleString()}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(1)} disabled={page <= 1}>«</button>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(page - 1)} disabled={page <= 1}>← Prev</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number" min={1} max={totalPages}
                placeholder="Go to..."
                value={jumpPage}
                onChange={e => setJumpPage(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { goToPage(parseInt(jumpPage)); setJumpPage(''); } }}
                style={{ width: 80, padding: '6px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-glass)', borderRadius: 8, color: 'white', fontSize: '0.8rem', outline: 'none', fontFamily: 'Outfit' }}
              />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(page + 1)} disabled={page >= totalPages}>Next →</button>
            <button className="btn btn-ghost btn-sm" onClick={() => goToPage(totalPages)} disabled={page >= totalPages}>»</button>
          </div>
        </div>
      )}
    </div>
  );
}
