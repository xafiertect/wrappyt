import { useState, useEffect } from 'react';
import { getOptimalSchedule } from '../services/api';
import { Clock, Star, AlertTriangle, RefreshCw } from 'lucide-react';

export default function Schedule() {
  const [slots,   setSlots]   = useState([]);
  const [tip,     setTip]     = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchSchedule = () => {
    setLoading(true);
    setError(null);
    getOptimalSchedule()
      .then(res => { setSlots(res.data.optimal_slots); setTip(res.data.general_tip); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Jam Posting Terbaik</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Rekomendasi waktu upload optimal berdasarkan analisis aktivitas penonton Anda
          </p>
        </div>
        <button
          className="btn-ghost"
          onClick={fetchSchedule}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
        >
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      <div className="glass-panel card-3d glow-cyan" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
          </div>
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.85rem 1.1rem', color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <span>Gagal memuat jadwal: <strong>{error}</strong> — pastikan backend berjalan.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {slots.map((slot, i) => (
              <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid hsl(${180 + slot.score}deg, 80%, 55%)` }}>
                <div style={{ minWidth: 48, textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{i + 1}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} color="var(--accent-cyan)" />
                    <span>{slot.day} — {slot.time_wib} WIB</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{slot.reason}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={14} color="var(--accent-gold)" fill="var(--accent-gold)" />
                  <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{slot.score}</span>
                </div>
              </div>
            ))}
            {tip && (
              <div style={{ background: 'rgba(255,122,89,0.08)', border: '1px solid rgba(255,122,89,0.25)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--accent-cyan)', lineHeight: 1.7 }}>
                💡 {tip}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
