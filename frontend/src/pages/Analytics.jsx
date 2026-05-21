import { useState } from 'react';
import { Search, Filter, TrendingDown, TrendingUp, Minus, AlertTriangle } from 'lucide-react';

const MOCK_VIDEOS = [
  { id: 1, title: 'Rahasia CTR Naik 10% — Teknik Thumbnail Pro', views: 48200, ctr: 8.2, status: 'Viral',    anomaly: false, date: '2026-05-15' },
  { id: 2, title: 'Review Channel Hippo Academy Bulan Ini',       views: 22100, ctr: 4.1, status: 'Normal',   anomaly: false, date: '2026-05-12' },
  { id: 3, title: 'Cara Buat Konten Edukatif yang Ditonton Habis',views: 8900,  ctr: 2.4, status: 'Declining',anomaly: true,  date: '2026-05-10' },
  { id: 4, title: 'Optimasi Retensi: Hook 10 Detik Terbaik',     views: 31500, ctr: 6.8, status: 'Normal',   anomaly: false, date: '2026-05-08' },
  { id: 5, title: 'Analisis Algoritma YouTube Q2 2026',           views: 4200,  ctr: 1.8, status: 'Declining',anomaly: true,  date: '2026-05-05' },
  { id: 6, title: 'Tutorial Membuat Script Video 5 Menit',        views: 55000, ctr: 9.1, status: 'Viral',   anomaly: false, date: '2026-05-01' },
];

const STATUS_CONFIG = {
  Viral:    { color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',  icon: TrendingUp,   cls: 'badge-cyan'  },
  Normal:   { color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: Minus,        cls: 'badge-green' },
  Declining:{ color: '#EF4444', bg: 'rgba(239,68,68,0.1)',  icon: TrendingDown, cls: 'badge-red'   },
};

export default function Analytics() {
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('All');
  const [sortKey,   setSortKey]   = useState('views');
  const [sortDir,   setSortDir]   = useState('desc');

  const filtered = MOCK_VIDEOS
    .filter(v => {
      const matchSearch = v.title.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'All' || v.status === filter || (filter === 'Anomaly' && v.anomaly);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Analitik Video</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Daftar performa semua video channel</p>
      </div>

      {/* Controls */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            className="input-dark"
            placeholder="Cari judul video..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['All', 'Viral', 'Normal', 'Declining', 'Anomaly'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
            >
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.8rem' }}>
          <Filter size={14} />
          Urutkan:
          <select
            className="input-dark"
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            style={{ width: 'auto', padding: '0.4rem 0.7rem' }}
          >
            <option value="views">Views</option>
            <option value="ctr">CTR</option>
          </select>
          <button className="btn-ghost" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} style={{ padding: '0.4rem 0.7rem' }}>
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Judul Video', 'Views', 'CTR', 'Status', 'Upload', 'Anomali'].map(h => (
                <th key={h} style={{ padding: '0.85rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => {
              const cfg = STATUS_CONFIG[v.status];
              const Icon = cfg.icon;
              return (
                <tr
                  key={v.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  <td style={{ padding: '0.9rem 1.25rem', maxWidth: 320 }}>
                    <span style={{ fontSize: '0.875rem', color: '#E2E8F0', fontWeight: 500 }}>{v.title}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{v.views.toLocaleString()}</span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span style={{ color: v.ctr >= 5 ? '#10B981' : v.ctr >= 3 ? '#F59E0B' : '#EF4444', fontWeight: 600 }}>
                      {v.ctr}%
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    <span className={`badge ${cfg.cls}`}>
                      <Icon size={11} />
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1.25rem', color: '#64748B', fontSize: '0.8rem' }}>{v.date}</td>
                  <td style={{ padding: '0.9rem 1.25rem' }}>
                    {v.anomaly ? (
                      <span className="badge badge-red" style={{ animation: 'pulse-red 2s infinite' }}>
                        <AlertTriangle size={11} />
                        Anomali
                      </span>
                    ) : (
                      <span style={{ color: '#334155', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', color: '#475569', fontSize: '0.78rem' }}>
          Menampilkan {filtered.length} dari {MOCK_VIDEOS.length} video
        </div>
      </div>
    </div>
  );
}
