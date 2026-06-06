import { useState, useEffect } from 'react';
import { getVideoAnalytics, getForecastData, predictPerformance, getYouTubeStatus, getYouTubeChannel } from '../services/api';
import {
  Search, Filter, TrendingDown, TrendingUp, Minus, AlertTriangle, RefreshCw,
  Zap, X, Youtube, CheckCircle, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// Threshold views: Viral ≥100k | Normal 20k–100k | Tidak Viral <20k | Anomali = IsolationForest
const STATUS_CONFIG = {
  Viral:        { color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.1)',   icon: TrendingUp,   cls: 'badge-cyan'   },
  Normal:       { color: 'var(--accent-gold)', bg: 'rgba(245,158,11,0.1)',  icon: Minus,        cls: 'badge-yellow' },
  'Tidak Viral':{ color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.1)',   icon: TrendingDown, cls: 'badge-red'    },
  Anomali:      { color: '#A78BFA',            bg: 'rgba(167,139,250,0.1)', icon: AlertTriangle, cls: 'badge-purple' },
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
// ─── Skeleton loader ──────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '1rem 1.25rem' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
      ))}
    </div>
  );
}

// ─── Prophet Forecast Chart ───────────────────────────────────────────────────
function ForecastChart() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getForecastData(30)
      .then(res => {
        const rows = res.data?.data || [];
        // Normalise: keep only rows with valid yhat
        setData(rows.filter(r => r.yhat != null).map(r => ({
          date:  r.ds ? String(r.ds).slice(0, 10) : '',
          yhat:  Math.round(r.yhat),
          lower: Math.round(r.yhat_lower ?? r.yhat),
          upper: Math.round(r.yhat_upper ?? r.yhat),
        })));
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />;

  if (error || data.length === 0) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', flexDirection: 'column', gap: 8 }}>
      <span>📈</span>
      <span>{error ? `Gagal memuat forecast: ${error}` : 'Data forecast Prophet belum tersedia. Jalankan notebook 09 terlebih dahulu.'}</span>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.8rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--accent-cyan)' }}>Prediksi: <strong>{payload[0]?.payload?.yhat?.toLocaleString()}</strong></p>
        <p style={{ color: 'var(--text-dim)' }}>
          CI: {payload[0]?.payload?.lower?.toLocaleString()} – {payload[0]?.payload?.upper?.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="yhatGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent-cyan)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--text-dim)" stopOpacity={0.15} />
            <stop offset="95%" stopColor="var(--text-dim)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: 'var(--text-dim)' }}
          tickFormatter={v => v.slice(5)} // MM-DD only
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10, fill: 'var(--text-dim)' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
        <Tooltip content={<CustomTooltip />} />
        {/* CI band — upper */}
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" fillOpacity={1} legendType="none" />
        {/* CI band — lower (mask the bottom to create a band effect) */}
        <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-dark)" fillOpacity={1} legendType="none" />
        {/* Main forecast line */}
        <Area type="monotone" dataKey="yhat" stroke="var(--accent-cyan)" fill="url(#yhatGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Predict Modal ────────────────────────────────────────────────────────────
function PredictModal({ video, result, onClose }) {
  if (!result) return null;

  const { predicted_views, anomaly, decline, status, confidence, recommendation } = result;

  const riskColor = {
    'Low Risk':    'var(--accent-green)',
    'Medium Risk': 'var(--accent-gold)',
    'High Risk':   'var(--accent-red)',
    'Critical':    '#FF4500',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="glass-panel card-3d"
        style={{ width: '100%', maxWidth: 540, borderRadius: 16, padding: '1.5rem', position: 'relative' }}
      >
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {video.video_id && (
            <img
              src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
              alt={video.title}
              style={{ width: 80, height: 45, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {video.title || 'Video'}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 2 }}>
              Prediksi Views · XGBoost + Isolation Forest
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span style={{
            padding: '0.3rem 0.75rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700,
            background: status === 'Viral' ? 'rgba(6,182,212,0.15)' : status === 'Tidak Viral' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            color: status === 'Viral' ? 'var(--accent-cyan)' : status === 'Tidak Viral' ? 'var(--accent-red)' : 'var(--accent-gold)',
          }}>
            {status === 'Viral' ? '🚀' : status === 'Tidak Viral' ? '📉' : '📊'} {status}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            confidence {(confidence * 100).toFixed(0)}%
          </span>
        </div>

        {/* Views forecast */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: '1 Hari', val: predicted_views?.days_1 },
            { label: '2 Hari', val: predicted_views?.days_2 },
            { label: '3 Hari', val: predicted_views?.days_3 },
          ].map(({ label, val }) => (
            <div key={label} style={{
              background: 'var(--bg-card)', borderRadius: 10, padding: '0.75rem', textAlign: 'center',
              border: '1px solid var(--border-glass)',
            }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                {val != null ? (val >= 1000 ? `${(val / 1000).toFixed(1)}K` : val) : '—'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 3 }}>+{label}</div>
            </div>
          ))}
        </div>

        {/* Anomaly + Decline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: 10, padding: '0.75rem',
            border: `1px solid ${anomaly?.is_anomaly ? 'rgba(239,68,68,0.3)' : 'var(--border-glass)'}`,
          }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Anomali</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              {anomaly?.is_anomaly
                ? <XCircle size={14} color="var(--accent-red)" />
                : <CheckCircle size={14} color="var(--accent-green)" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: anomaly?.is_anomaly ? 'var(--accent-red)' : 'var(--accent-green)' }}>
                {anomaly?.label || 'Normal'}
              </span>
            </div>
          </div>
          {decline && (
            <div style={{
              background: 'var(--bg-card)', borderRadius: 10, padding: '0.75rem',
              border: `1px solid ${decline.is_declining ? 'rgba(239,68,68,0.25)' : 'var(--border-glass)'}`,
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Risiko Decline</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: riskColor[decline.risk_level] || 'var(--text-primary)' }}>
                {decline.risk_level}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 2 }}>
                {(decline.decline_probability * 100).toFixed(0)}% prob
              </div>
            </div>
          )}
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div style={{
            background: 'rgba(6,182,212,0.06)', borderRadius: 10, padding: '0.75rem 1rem',
            border: '1px solid rgba(6,182,212,0.15)', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65,
          }}>
            {recommendation}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Empty State Component ────────────────────────────────────────────────────
function EmptyState({ onRefresh }) {
  return (
    <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--bg-badge)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
        📊
      </div>
      <div>
        <p style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 6 }}>Data video belum tersedia</p>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1.7, maxWidth: 360 }}>
          Pipeline notebook belum dijalankan atau file <code style={{ background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 4 }}>abis_cleaning.csv</code> belum ada.
          <br />Jalankan notebook <strong>02–07</strong> untuk mengisi data.
        </p>
      </div>
      <button className="btn-ghost" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', marginTop: 4 }}>
        <RefreshCw size={13} /> Coba Refresh
      </button>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, bg, pct, loading, glowClass }) {
  return (
    <div className={`glass-panel card-3d ${glowClass || ''}`} style={{ padding: '1rem 1.25rem', background: bg, borderRadius: 12, minWidth: 0 }}>
      {loading ? (
        <div className="skeleton" style={{ height: 42, borderRadius: 8 }} />
      ) : (
        <>
          <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          {pct != null && (
            <div style={{ fontSize: '0.7rem', color, marginTop: 3, opacity: 0.75 }}>
              {pct}% dari total
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function Analytics() {
  const PAGE_SIZE = 50;

  const [videos,      setVideos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [total,       setTotal]       = useState(0);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('All');
  const [sortKey,     setSortKey]     = useState('views');
  const [sortDir,     setSortDir]     = useState('desc');
  const [page,        setPage]        = useState(1);

  // Per-video prediction
  const [predModal,   setPredModal]   = useState(null);  // { video, result }
  const [predLoading, setPredLoading] = useState(null);  // video_id

  // YouTube sync
  const [ytSyncing,   setYtSyncing]   = useState(false);
  const [ytMsg,       setYtMsg]       = useState(null);  // { type: 'ok'|'err'|'info', text }

  const fetchVideos = () => {
    setLoading(true);
    setError(null);
    setPage(1);
    getVideoAnalytics(2500)
      .then(res => {
        setVideos(res.data?.data || []);
        setTotal(res.data?.total || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVideos(); }, []);

  const handlePredict = async (video) => {
    setPredLoading(video.video_id);
    try {
      // Pakai data video yang sudah ada di tabel — tidak perlu panggil API lain
      const payload = {
        views:                  video.views              ?? 0,
        ctr:                    video.ctr                ?? 0,
        impressions:            video.impressions        ?? 0,
        avg_view_duration:      video.avg_view_duration  ?? '00:03:00',
        video_duration:         video.video_duration     ?? '00:10:00',
        likes:                  video.likes              ?? 0,
        comments:               video.comments           ?? 0,
        retention_rate:         video.retention_rate     ?? 0,
        subscriber_gained:      video.subscriber_gained  ?? 0,
        video_age_days:         video.video_age_days     ?? 30,
        lag_views_7d:           video.lag_views_7d       ?? 0,
        rolling_mean_views_14d: video.rolling_mean_14d   ?? 0,
        video_title:            video.title              ?? '',
      };
      const predRes = await predictPerformance(payload);
      setPredModal({ video, result: predRes.data });
    } catch (err) {
      setYtMsg({ type: 'err', text: `Prediksi gagal: ${err.message}` });
      setTimeout(() => setYtMsg(null), 4000);
    } finally {
      setPredLoading(null);
    }
  };

  const handleYtSync = async () => {
    setYtSyncing(true);
    setYtMsg(null);
    try {
      const statusRes = await getYouTubeStatus();
      if (!statusRes.data?.is_authenticated) {
        setYtMsg({ type: 'info', text: 'Belum login YouTube. Buka /auth/youtube/login di backend untuk autentikasi.' });
        return;
      }
      const chRes = await getYouTubeChannel(10);
      const ch = chRes.data;
      const vCount = ch?.video_count || ch?.recent_videos?.length || '?';
      setYtMsg({ type: 'ok', text: `Sinkronisasi berhasil · ${vCount} video terbaru dimuat dari YouTube` });
    } catch (err) {
      setYtMsg({ type: 'err', text: `Sync gagal: ${err.message}` });
    } finally {
      setYtSyncing(false);
      setTimeout(() => setYtMsg(null), 5000);
    }
  };

  const filtered = videos
    .filter(v => {
      const matchSearch = (v.title || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All' ? true : v.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const pageCount  = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(1);
  };

  const handleFilterChange = (key) => { setFilter(key); setPage(1); };
  const handleSearch = (val) => { setSearch(val); setPage(1); };

  // Derived summary counts (dihitung saat data ada maupun kosong)
  const anomalyCount    = videos.filter(v => v.status === 'Anomali').length;
  const viralCount      = videos.filter(v => v.status === 'Viral').length;
  const tidakViralCount = videos.filter(v => v.status === 'Tidak Viral').length;
  const normalCount     = videos.filter(v => v.status === 'Normal').length;
  const pct = (n) => videos.length > 0 ? ((n / videos.length) * 100).toFixed(0) : null;

  const noData = !loading && !error && videos.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Prediction Modal */}
      {predModal && (
        <PredictModal video={predModal.video} result={predModal.result} onClose={() => setPredModal(null)} />
      )}

      {/* Toast notification */}
      {ytMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 8888,
          padding: '0.75rem 1.1rem', borderRadius: 10, fontSize: '0.82rem',
          background: ytMsg.type === 'ok' ? 'rgba(16,185,129,0.12)' : ytMsg.type === 'err' ? 'rgba(239,68,68,0.12)' : 'rgba(6,182,212,0.12)',
          border: `1px solid ${ytMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : ytMsg.type === 'err' ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.3)'}`,
          color: ytMsg.type === 'ok' ? 'var(--accent-green)' : ytMsg.type === 'err' ? 'var(--accent-red)' : 'var(--accent-cyan)',
          maxWidth: 360,
        }}>
          {ytMsg.text}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Analitik Video</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {loading
              ? 'Memuat data...'
              : noData
                ? 'Belum ada data — jalankan pipeline notebook terlebih dahulu'
                : `${total.toLocaleString()} video di dataset · ${anomalyCount > 0 ? `⚠️ ${anomalyCount} anomali` : 'Tidak ada anomali'}`
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className="btn-ghost"
            onClick={handleYtSync}
            disabled={ytSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
          >
            <Youtube size={14} style={ytSyncing ? { animation: 'spin 1s linear infinite' } : {}} />
            Sync YouTube
          </button>
          <button
            className="btn-ghost"
            onClick={fetchVideos}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards — selalu tampil (skeleton saat loading, 0 saat noData) ─── */}
      <div className="analytics-kpi-grid">
        <KpiCard loading={loading} label="🚀 Video Viral"   value={viralCount}      color="var(--accent-cyan)" bg="rgba(6,182,212,0.07)"  pct={pct(viralCount)} glowClass="glow-cyan" />
        <KpiCard loading={loading} label="📊 Video Normal"  value={normalCount}     color="var(--accent-gold)" bg="rgba(245,158,11,0.07)" pct={pct(normalCount)} glowClass="glow-gold" />
        <KpiCard loading={loading} label="📉 Tidak Viral"   value={tidakViralCount} color="var(--accent-red)" bg="rgba(239,68,68,0.07)"  pct={pct(tidakViralCount)} glowClass="glow-red" />
        <KpiCard loading={loading} label="⚠️ Anomali"       value={anomalyCount}    color="#A78BFA" bg="rgba(167,139,250,0.07)" pct={pct(anomalyCount)} glowClass="glow-purple" />
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.85rem 1.1rem', color: 'var(--accent-red)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Gagal memuat data: <strong>{error}</strong> — pastikan backend berjalan di port 8000.</span>
        </div>
      )}

      {/* ── Prophet Forecast ──────────────────────────────────────────────────── */}
      <div className="glass-panel card-3d glow-cyan" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Forecast Views — Prophet Model</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>30 hari ke depan · Area abu-abu = confidence interval 95%</p>
        </div>
        <ForecastChart />
      </div>

      {/* ── Filter & Sort Controls ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            className="input-dark"
            placeholder="Cari judul video..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
            disabled={videos.length === 0}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'All',         label: 'Semua' },
            { key: 'Viral',       label: `🚀 Viral (${viralCount})` },
            { key: 'Normal',      label: `📊 Normal (${normalCount})` },
            { key: 'Tidak Viral', label: `📉 Tidak Viral (${tidakViralCount})` },
            { key: 'Anomali',     label: `⚠️ Anomali (${anomalyCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleFilterChange(key)}
              className={filter === key ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
          <Filter size={14} />
          <button className="btn-ghost" onClick={() => toggleSort('views')} style={{ padding: '0.4rem 0.7rem', color: sortKey === 'views' ? 'var(--accent-cyan)' : undefined }}>
            Views {sortKey === 'views' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button className="btn-ghost" onClick={() => toggleSort('ctr')} style={{ padding: '0.4rem 0.7rem', color: sortKey === 'ctr' ? 'var(--accent-cyan)' : undefined }}>
            CTR {sortKey === 'ctr' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="glass-panel card-3d" style={{ padding: 0, overflowX: 'auto' }}>
        {loading ? (
          <TableSkeleton />
        ) : noData ? (
          <EmptyState onRefresh={fetchVideos} />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-badge)' }}>
                  {['Judul Video', 'Views', 'CTR', 'Status', 'Upload', 'Anomali', 'Prediksi'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1.25rem', textAlign: 'left',
                      fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      minWidth: h === 'Judul Video' ? 300 : undefined,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem' }}>
                      Tidak ada video yang cocok dengan filter <strong>&quot;{filter}&quot;</strong>{search ? ` + kata kunci "${search}"` : ''}.
                    </td>
                  </tr>
                ) : paginated.map((v, i) => {
                  const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG['Normal'];
                  const Icon = cfg.icon;
                  const dateStr = v.date ? String(v.date).slice(0, 10) : '—';
                  return (
                    <tr
                      key={v.video_id || i}
                      style={{
                        borderBottom: '1px solid var(--border-glass)',
                        background: i % 2 === 0 ? 'transparent' : 'var(--bg-badge)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-badge)'}
                    >
                      {/* Judul */}
                      <td style={{ padding: '0.75rem 1.25rem', maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {v.video_id ? (
                            <img
                              src={`https://img.youtube.com/vi/${v.video_id}/mqdefault.jpg`}
                              alt={v.title || 'thumbnail'}
                              loading="lazy"
                              onError={e => { e.currentTarget.src = 'https://placehold.co/96x54/1a1a2e/666?text=No+Thumb'; }}
                              style={{
                                width: 96, height: 54, borderRadius: 6,
                                objectFit: 'cover', flexShrink: 0,
                                border: '1px solid var(--border-glass)',
                              }}
                            />
                          ) : (
                            <div style={{
                              width: 96, height: 54, borderRadius: 6, flexShrink: 0,
                              background: 'var(--bg-badge)', border: '1px solid var(--border-glass)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '1.2rem',
                            }}>🎬</div>
                          )}
                          <div style={{ overflow: 'hidden' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {v.title || 'Video'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{v.video_id}</span>
                          </div>
                        </div>
                      </td>
                      {/* Views */}
                      <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {(v.views ?? 0).toLocaleString()}
                        </span>
                      </td>
                      {/* CTR */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: v.ctr >= 5 ? 'var(--accent-green)' : v.ctr >= 3 ? 'var(--accent-gold)' : 'var(--accent-red)',
                        }}>
                          {(v.ctr ?? 0).toFixed(1)}%
                        </span>
                        <div style={{ fontSize: '0.65rem', color: v.ctr >= 5 ? 'rgba(16,185,129,0.5)' : v.ctr >= 3 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.5)', marginTop: 1 }}>
                          {v.ctr >= 5 ? 'Baik' : v.ctr >= 3 ? 'Rata-rata' : 'Rendah'}
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span className={`badge ${cfg.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon size={10} />
                          {v.status}
                        </span>
                      </td>
                      {/* Upload date */}
                      <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{dateStr}</td>
                      {/* Anomali */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {v.anomaly ? (
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={10} />
                            Anomali
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontWeight: 700 }}>—</span>
                        )}
                      </td>
                      {/* Prediksi */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <button
                          className="btn-ghost"
                          disabled={predLoading === v.video_id}
                          onClick={() => handlePredict(v)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}
                        >
                          <Zap size={11} style={predLoading === v.video_id ? { animation: 'spin 1s linear infinite' } : {}} />
                          {predLoading === v.video_id ? '...' : 'Prediksi'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Footer / Pagination */}
            <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                Hal <strong style={{ color: 'var(--text-muted)' }}>{page}</strong>/{pageCount || 1} ·{' '}
                <strong style={{ color: 'var(--text-muted)' }}>{filtered.length}</strong> hasil
                {total > videos.length && <span> (total dataset: {total.toLocaleString()})</span>}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {filter !== 'All' && (
                  <button className="btn-ghost" onClick={() => { handleFilterChange('All'); handleSearch(''); }}
                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                    × Hapus filter
                  </button>
                )}
                <button
                  className="btn-ghost"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  ← Prev
                </button>
                {/* Page number chips — show up to 5 pages around current */}
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
                  const pg = start + i;
                  return pg <= pageCount ? (
                    <button
                      key={pg}
                      onClick={() => setPage(pg)}
                      className={pg === page ? 'btn-primary' : 'btn-ghost'}
                      style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem', minWidth: 32 }}
                    >
                      {pg}
                    </button>
                  ) : null;
                })}
                <button
                  className="btn-ghost"
                  disabled={page >= pageCount}
                  onClick={() => setPage(p => p + 1)}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
