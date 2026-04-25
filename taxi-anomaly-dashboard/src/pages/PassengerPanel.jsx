import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API } from '../config';

function ScoreMeter({ score, isAnomaly }) {
  const color = isAnomaly ? 'var(--accent-rose)' : score > 50 ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width="180" height="180" viewBox="0 0 120 120">
        {/* Track */}
        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        {/* Progress */}
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 60 60)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.2,0.8,0.2,1), stroke 0.5s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit', color, lineHeight: 1 }}>
          {score.toFixed(1)}%
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>
          Risk Score
        </div>
      </div>
    </div>
  );
}

export default function PassengerPanel() {
  const [fare, setFare] = useState('');
  const [distance, setDistance] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${API}/anomalies/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fare_amount: parseFloat(fare),
          trip_distance: parseFloat(distance),
          passenger_count: parseInt(passengers, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check ride');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const expected = result?.expected_fare?.toFixed(2);
  const inputDist = parseFloat(distance);

  let verdictTitle = 'Fare Looks Fair';
  let verdictDesc = `Based on NYC TLC rules (Base: $7 + Dist: $3.50/mi + Time), a ${inputDist} mile trip should cost ~$${expected}. Your fare is safely within acceptable boundaries.`;
  let verdictColor = 'var(--accent-emerald)';

  if (result) {
    if (result.anomaly_type === 'overcharge') {
      verdictTitle = 'Overcharge Detected';
      verdictDesc = `A standard ${inputDist} mile NYC trip costs ~$${expected} (Base + Distance + Traffic Time). You paid $${fare}, which is highly inflated and indicates a likely scam or illegal surcharge.`;
      verdictColor = 'var(--accent-rose)';
    } else if (result.anomaly_type === 'undercharge') {
      verdictTitle = 'Unusually Low Fare';
      verdictDesc = `A standard ${inputDist} mile NYC trip costs ~$${expected}. You paid $${fare}, which is mathematically too low for standard NYC pricing.`;
      verdictColor = 'var(--accent-amber)';
    } else if (result.anomaly_type === 'unusual_pattern') {
      verdictTitle = 'Unusual Trip Pattern';
      verdictDesc = `Your fare matches the ~$${expected} baseline for a ${inputDist} mile trip, but our AI flagged extreme rarity in other metrics, such as your passenger count or speed.`;
      verdictColor = 'var(--accent-violet)';
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 40px',
        background: 'rgba(2,6,23,0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'var(--gradient-blue)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
            boxShadow: 'var(--shadow-glow)'
          }}>🚖</div>
          <div>
            <div style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'white' }}>TaxiGuard</div>
            <div style={{ fontFamily: 'Outfit', fontSize: '0.65rem', color: 'var(--accent-cyan)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Passenger Portal</div>
          </div>
        </div>
        <Link to="/login" style={{
          fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600,
          color: 'var(--text-secondary)', textDecoration: 'none', padding: '8px 16px',
          borderRadius: 8, border: '1px solid var(--border-glass)',
          background: 'rgba(255,255,255,0.03)', transition: 'all 0.2s'
        }}>Admin Login →</Link>
      </nav>

      {/* ── Hero ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 32, alignItems: 'center', transition: 'all 0.5s' }}>

          {/* ── Left: Form ── */}
          <div>
            {/* Heading */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 99, padding: '6px 14px', marginBottom: 16 }}>
                <span style={{ fontSize: '0.7rem', fontFamily: 'Outfit', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>🛡 AI Fare Checker</span>
              </div>
              <h1 style={{
                fontFamily: 'Outfit', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800,
                lineHeight: 1.1, letterSpacing: '-0.03em', color: 'white', marginBottom: 12
              }}>
                Was your fare<br />
                <span style={{ background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  overcharged?
                </span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 380 }}>
                Enter your trip details and our ML model trained on 2.7M NYC taxi rides will instantly flag suspicious fares.
              </p>
            </div>

            {/* Form Card */}
            <div style={{
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-xl)',
              padding: '32px'
            }}>
              <form onSubmit={handleCheck} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>💵 Fare (USD)</label>
                    <input
                      className="input" type="number" step="0.01" min="0.1" required
                      placeholder="e.g. 25.50"
                      value={fare} onChange={e => setFare(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>📍 Distance (miles)</label>
                    <input
                      className="input" type="number" step="0.1" min="0.1" required
                      placeholder="e.g. 3.5"
                      value={distance} onChange={e => setDistance(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ maxWidth: 160 }}>
                  <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>👥 Passengers</label>
                  <input
                    className="input" type="number" min="1" max="6" required
                    value={passengers} onChange={e => setPassengers(e.target.value)}
                  />
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 'var(--radius-md)',
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? 'rgba(255,255,255,0.05)' : 'var(--gradient-blue)',
                    color: 'white', fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
                    boxShadow: loading ? 'none' : 'var(--shadow-btn)',
                    transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                  }}
                >
                  {loading && <span className="spinner" />}
                  {loading ? 'Analyzing your ride...' : '⚡ Check My Fare'}
                </button>

                {error && (
                  <div style={{
                    background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                    borderRadius: 'var(--radius-md)', padding: '12px 16px',
                    color: 'var(--accent-rose)', fontSize: '0.875rem', textAlign: 'center'
                  }}>
                    ⚠️ {error}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* ── Right: Result ── */}
          {result && (
            <div className="fade-in" style={{
              background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(20px)',
              border: `1px solid ${result.is_anomaly ? 'rgba(244,63,94,0.4)' : 'rgba(16,185,129,0.35)'}`,
              borderRadius: 'var(--radius-xl)', padding: '40px 32px', textAlign: 'center',
              boxShadow: result.is_anomaly ? '0 0 40px rgba(244,63,94,0.15)' : '0 0 40px rgba(16,185,129,0.15)'
            }}>

              {/* Score Meter */}
              <ScoreMeter score={result.score} isAnomaly={result.is_anomaly} />

              {/* Verdict */}
              <div style={{ marginTop: 24, marginBottom: 20 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>
                  {result.is_anomaly ? '🚨' : '✅'}
                </div>
                <h2 style={{
                  fontFamily: 'Outfit', fontSize: '1.5rem', fontWeight: 800,
                  color: verdictColor, marginBottom: 8
                }}>
                  {verdictTitle}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {verdictDesc}
                </p>
              </div>

              {/* Breakdown Stats */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 16,
                border: '1px solid var(--border-glass)'
              }}>
                {[
                  { label: 'Est. Duration', value: `${result.breakdown.estimated_duration_min} min` },
                  { label: 'Base Fare', value: `~$${result.expected_fare?.toFixed(2)}` },
                  { label: 'Fare / min', value: `$${result.breakdown.fare_per_min}` },
                  { label: 'Threshold', value: '> 85% = anomaly' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '10px 0' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Outfit', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Re-check */}
              <button
                onClick={() => setResult(null)}
                style={{
                  marginTop: 20, width: '100%', padding: '10px',
                  background: 'transparent', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-muted)',
                  fontFamily: 'Outfit', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                ← Check Another Fare
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
