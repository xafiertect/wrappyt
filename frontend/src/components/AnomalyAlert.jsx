import { AlertTriangle, TrendingDown } from 'lucide-react';

export default function AnomalyAlert({ anomaly, videoTitle }) {
  if (!anomaly?.is_anomaly) return null;

  return (
    <div className="glass-panel pulse-red" style={{
      border: '1px solid rgba(239,68,68,0.4)',
      background: 'rgba(239,68,68,0.08)',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: '10px',
        background: 'rgba(239,68,68,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <AlertTriangle size={20} color="#EF4444" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
          <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '0.95rem' }}>
            ⚠ Anomali Penurunan Views Terdeteksi
          </span>
          <span className="badge badge-red">
            <TrendingDown size={11} />
            Score: {anomaly.anomaly_score?.toFixed(3) ?? 'N/A'}
          </span>
        </div>
        {videoTitle && (
          <div style={{ fontSize: '0.82rem', color: '#94A3B8', marginBottom: '0.35rem' }}>
            Video: <span style={{ color: '#F8FAFC' }}>{videoTitle}</span>
          </div>
        )}
        <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
          Sistem mendeteksi pola tidak normal pada metrik performa. Segera evaluasi thumbnail, CTR, dan retensi video ini.
        </div>
      </div>
    </div>
  );
}
