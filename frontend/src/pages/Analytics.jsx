import { useState, useEffect } from 'react';
import { getVideoAnalytics, getForecastData } from '../services/api';
import {
  Search, Filter, TrendingDown, TrendingUp, Minus, AlertTriangle, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// Hippo Academy rule: Viral ≥2k/2h | Normal 1k–2k/2h | Tidak Viral <1k/2h
const STATUS_CONFIG = {
  Viral:        { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   icon: TrendingUp,   cls: 'badge-cyan'   },
  Normal:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  icon: Minus,        cls: 'badge-yellow' },
  'Tidak Viral':{ color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   icon: TrendingDown, cls: 'badge-red'    },
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '1rem 1.25rem' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8 }} />
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
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem', flexDirection: 'column', gap: 8 }}>
      <span>📈</span>
      <span>{error ? `Gagal memuat forecast: ${error}` : 'Data forecast Prophet belum tersedia. Jalankan notebook 09 terlebih dahulu.'}</span>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.8rem' }}>
        <p style={{ color: '#94A3B8', marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#06B6D4' }}>Prediksi: <strong>{payload[0]?.payload?.yhat?.toLocaleString()}</strong></p>
        <p style={{ color: '#475569' }}>
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
            <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#475569" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#475569' }}
          tickFormatter={v => v.slice(5)} // MM-DD only
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
        <Tooltip content={<CustomTooltip />} />
        {/* CI band — upper */}
        <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" fillOpacity={1} legendType="none" />
        {/* CI band — lower (mask the bottom to create a band effect) */}
        <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-dark, #0B0F19)" fillOpacity={1} legendType="none" />
        {/* Main forecast line */}
        <Area type="monotone" dataKey="yhat" stroke="#06B6D4" fill="url(#yhatGrad)" strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Empty State Component ────────────────────────────────────────────────────
function EmptyState({ onRefresh }) {
  return (
    <div style={{ padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(100,116,139,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
        📊
      </div>
      <div>
        <p style={{ fontWeight: 700, color: '#94A3B8', fontSize: '0.95rem', marginBottom: 6 }}>Data video belum tersedia</p>
        <p style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.7, maxWidth: 360 }}>
          Pipeline notebook belum dijalankan atau file <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>abis_cleaning.csv</code> belum ada.
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
function KpiCard({ label, value, color, bg, pct, loading }) {
  return (
    <div className="glass-panel" style={{ padding: '1rem 1.25rem', background: bg, borderRadius: 12, minWidth: 0 }}>
      {loading ? (
        <div className="skeleton" style={{ height: 42, borderRadius: 8 }} />
      ) : (
        <>
          <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 4 }}>{label}</div>
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
  const [videos,   setVideos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('All');
  const [sortKey,  setSortKey]  = useState('views');
  const [sortDir,  setSortDir]  = useState('desc');

  const fetchVideos = () => {
    setLoading(true);
    setError(null);
    getVideoAnalytics(100)
      .then(res => {
        setVideos(res.data?.data || []);
        setTotal(res.data?.total || 0);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchVideos(); }, []);

  const filtered = videos
    .filter(v => {
      const matchSearch = (v.title || '').toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === 'All'     ? true :
        filter === 'Anomaly' ? v.anomaly :
        v.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Derived summary counts (dihitung saat data ada maupun kosong)
  const anomalyCount    = videos.filter(v => v.anomaly).length;
  const viralCount      = videos.filter(v => v.status === 'Viral').length;
  const tidakViralCount = videos.filter(v => v.status === 'Tidak Viral').length;
  const normalCount     = videos.length - viralCount - tidakViralCount;
  const pct = (n) => videos.length > 0 ? ((n / videos.length) * 100).toFixed(0) : null;

  const noData = !loading && !error && videos.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Analitik Video</h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
            {loading
              ? 'Memuat data...'
              : noData
                ? 'Belum ada data — jalankan pipeline notebook terlebih dahulu'
                : `${total.toLocaleString()} video di dataset · ${anomalyCount > 0 ? `⚠️ ${anomalyCount} anomali` : 'Tidak ada anomali'}`
            }
          </p>
        </div>
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

      {/* ── KPI Cards — selalu tampil (skeleton saat loading, 0 saat noData) ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KpiCard loading={loading} label="🚀 Video Viral"   value={viralCount}      color="#06B6D4" bg="rgba(6,182,212,0.07)"  pct={pct(viralCount)} />
        <KpiCard loading={loading} label="📊 Video Normal"  value={normalCount}     color="#F59E0B" bg="rgba(245,158,11,0.07)" pct={pct(normalCount)} />
        <KpiCard loading={loading} label="📉 Tidak Viral"   value={tidakViralCount} color="#EF4444" bg="rgba(239,68,68,0.07)"  pct={pct(tidakViralCount)} />
        <KpiCard loading={loading} label="⚠️ Anomali"       value={anomalyCount}    color="#A78BFA" bg="rgba(167,139,250,0.07)" pct={pct(anomalyCount)} />
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.85rem 1.1rem', color: '#FCA5A5', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Gagal memuat data: <strong>{error}</strong> — pastikan backend berjalan di port 8000.</span>
        </div>
      )}

      {/* ── Prophet Forecast ──────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Forecast Views — Prophet Model</h2>
          <p style={{ fontSize: '0.78rem', color: '#64748B' }}>30 hari ke depan · Area abu-abu = confidence interval 95%</p>
        </div>
        <ForecastChart />
      </div>

      {/* ── Filter & Sort Controls ────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            className="input-dark"
            placeholder="Cari judul video..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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
            { key: 'Anomaly',     label: `⚠️ Anomali (${anomalyCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={filter === key ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.78rem' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.8rem', marginLeft: 'auto' }}>
          <Filter size={14} />
          <button className="btn-ghost" onClick={() => toggleSort('views')} style={{ padding: '0.4rem 0.7rem', color: sortKey === 'views' ? '#06B6D4' : undefined }}>
            Views {sortKey === 'views' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
          <button className="btn-ghost" onClick={() => toggleSort('ctr')} style={{ padding: '0.4rem 0.7rem', color: sortKey === 'ctr' ? '#06B6D4' : undefined }}>
            CTR {sortKey === 'ctr' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <TableSkeleton />
        ) : noData ? (
          <EmptyState onRefresh={fetchVideos} />
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                  {['Judul Video', 'Views', 'CTR', 'Status', 'Upload', 'Anomali'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1.25rem', textAlign: 'left',
                      fontSize: '0.72rem', color: '#64748B', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
                      Tidak ada video yang cocok dengan filter <strong>&quot;{filter}&quot;</strong>{search ? ` + kata kunci "${search}"` : ''}.
                    </td>
                  </tr>
                ) : filtered.map((v, i) => {
                  const cfg = STATUS_CONFIG[v.status] || STATUS_CONFIG['Normal'];
                  const Icon = cfg.icon;
                  const dateStr = v.date ? String(v.date).slice(0, 10) : '—';
                  return (
                    <tr
                      key={v.video_id || i}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
                    >
                      {/* Judul */}
                      <td style={{ padding: '0.9rem 1.25rem', maxWidth: 300 }}>
                        <span style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.title || 'Video'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#334155' }}>{v.video_id}</span>
                      </td>
                      {/* Views */}
                      <td style={{ padding: '0.9rem 1.25rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: '0.9rem' }}>
                          {(v.views ?? 0).toLocaleString()}
                        </span>
                      </td>
                      {/* CTR */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        <span style={{
                          fontWeight: 700,
                          color: v.ctr >= 5 ? '#10B981' : v.ctr >= 3 ? '#F59E0B' : '#EF4444',
                        }}>
                          {(v.ctr ?? 0).toFixed(1)}%
                        </span>
                        <div style={{ fontSize: '0.65rem', color: v.ctr >= 5 ? '#10B98180' : v.ctr >= 3 ? '#F59E0B80' : '#EF444480', marginTop: 1 }}>
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
                      <td style={{ padding: '0.9rem 1.25rem', color: '#64748B', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{dateStr}</td>
                      {/* Anomali */}
                      <td style={{ padding: '0.9rem 1.25rem' }}>
                        {v.anomaly ? (
                          <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={10} />
                            Anomali
                          </span>
                        ) : (
                          <span style={{ color: '#1E293B', fontSize: '0.85rem', fontWeight: 700 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Footer */}
            <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', color: '#334155', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Menampilkan <strong style={{ color: '#64748B' }}>{filtered.length}</strong> dari <strong style={{ color: '#64748B' }}>{videos.length}</strong> video
                {total > videos.length && <span style={{ color: '#475569' }}> (dataset penuh: {total.toLocaleString()})</span>}
              </span>
              {filter !== 'All' && (
                <button className="btn-ghost" onClick={() => { setFilter('All'); setSearch(''); }}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                  × Hapus filter
                </button>
              )}
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
