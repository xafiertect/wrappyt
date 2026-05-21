import { useState, useEffect } from 'react';
import { predictPerformance, getYouTubeStatus, getYouTubeChannel, getVideoMetrics, logoutYouTube, getYoutubeVideos, syncYoutubeVideo } from '../services/api';
import MetricCard from '../components/MetricCard';
import AnomalyAlert from '../components/AnomalyAlert';
import { Eye, MousePointerClick, TrendingUp, Users, Send, Loader, RefreshCw, Youtube, LogOut, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const defaultForm = {
  views: 15000, ctr: 4.5, impressions: 200000,
  avg_view_duration: '00:03:30', video_duration: '00:10:00',
  likes: 500, comments: 120, retention_rate: 35.0,
  subscriber_gained: 50, video_age_days: 5,
  lag_views_7d: 12000, rolling_mean_views_14d: 11000,
};

const STATUS_COLOR = { Viral: '#06B6D4', Normal: '#10B981', Declining: '#EF4444' };

export default function Dashboard() {
  const [form, setForm]             = useState(defaultForm);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // YouTube OAuth states
  const [ytStatus, setYtStatus]         = useState({ is_authenticated: false, is_configured: false });
  const [ytChannel, setYtChannel]       = useState(null);
  const [ytVideos, setYtVideos]         = useState([]);
  const [ytLoading, setYtLoading]       = useState(false);
  const [ytSyncLoading, setYtSyncLoading] = useState(false);
  const [ytMessage, setYtMessage]       = useState(null);

  // CSV fallback states
  const [csvVideos, setCsvVideos]       = useState([]);
  const [syncInput, setSyncInput]       = useState('');
  const [syncLoading, setSyncLoading]   = useState(false);

  // Check YouTube connection status on mount + handle callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('yt_connected') === 'true') {
      setYtMessage({ type: 'success', text: '✅ Berhasil terhubung dengan akun YouTube!' });
      window.history.replaceState({}, '', '/');
    }
    if (params.get('yt_error')) {
      setYtMessage({ type: 'error', text: '❌ Koneksi YouTube dibatalkan.' });
      window.history.replaceState({}, '', '/');
    }

    // Check OAuth status
    getYouTubeStatus()
      .then(res => {
        setYtStatus(res.data);
        if (res.data.is_authenticated) {
          loadYouTubeChannel();
        }
      })
      .catch(() => {});

    // Load CSV sample videos for fallback
    getYoutubeVideos()
      .then(res => setCsvVideos(res.data.data || []))
      .catch(() => {});
  }, []);

  const loadYouTubeChannel = async () => {
    setYtLoading(true);
    try {
      const res = await getYouTubeChannel(20);
      setYtChannel(res.data.channel);
      setYtVideos(res.data.videos || []);
    } catch (e) {
      setYtMessage({ type: 'error', text: e.message });
    } finally {
      setYtLoading(false);
    }
  };

  const handleSelectYtVideo = async (videoId) => {
    if (!videoId) return;
    setYtSyncLoading(true);
    setYtMessage(null);
    try {
      const res = await getVideoMetrics(videoId);
      if (res.data?.status === 'success') {
        setForm(prev => ({ ...prev, ...res.data.metrics }));
        const analyticsNote = res.data.analytics_available ? 'data analytics real-time' : 'data statistik video';
        setYtMessage({
          type: 'success',
          text: `✅ Berhasil memuat ${analyticsNote} untuk: "${res.data.video_title}"`
        });
      }
    } catch (e) {
      setYtMessage({ type: 'error', text: e.message });
    } finally {
      setYtSyncLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutYouTube();
    setYtStatus({ is_authenticated: false, is_configured: true });
    setYtChannel(null);
    setYtVideos([]);
    setYtMessage({ type: 'info', text: 'Berhasil logout dari akun YouTube.' });
  };

  // CSV fallback sync
  const handleCsvSync = async (idOrUrl) => {
    if (!idOrUrl) return;
    setSyncLoading(true);
    setYtMessage(null);
    try {
      const res = await syncYoutubeVideo(idOrUrl);
      if (res.data?.status === 'success') {
        setForm(res.data.metrics);
        setYtMessage({
          type: 'success',
          text: `✅ "${res.data.video_title}" ${res.data.is_fallback ? '(dari dataset sampel)' : ''}`
        });
      }
    } catch (e) {
      setYtMessage({ type: 'error', text: e.message });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: isNaN(value) ? value : Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await predictPerformance(form);
      setResult(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { label: 'Saat Ini', views: form.views },
    { label: '7 Hari',   views: result.predicted_views?.days_7 },
    { label: '14 Hari',  views: result.predicted_views?.days_14 },
    { label: '30 Hari',  views: result.predicted_views?.days_30 },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Dashboard Performa</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Prediksi views &amp; deteksi anomali berbasis Machine Learning
        </p>
      </div>

      {/* ── YouTube Integration Panel ─────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        border: ytStatus.is_authenticated
          ? '1px solid rgba(16,185,129,0.3)'
          : '1px solid rgba(239,68,68,0.2)',
        background: ytStatus.is_authenticated
          ? 'rgba(16,185,129,0.04)'
          : 'rgba(239,68,68,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {/* Panel Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: ytStatus.is_authenticated ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {ytStatus.is_authenticated
                ? <CheckCircle size={18} color="#10B981" />
                : <Youtube size={18} color="#EF4444" />
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                {ytStatus.is_authenticated ? 'Terhubung dengan YouTube' : 'Hubungkan Akun YouTube'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>
                {ytStatus.is_authenticated && ytChannel
                  ? `${ytChannel.title} • ${ytChannel.subscriber_count?.toLocaleString()} subscriber`
                  : ytStatus.is_configured
                    ? 'Login untuk mengambil data video real-time dari channel Anda'
                    : 'Tambahkan YOUTUBE_CLIENT_ID di .env untuk mengaktifkan fitur ini'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {ytStatus.is_authenticated ? (
              <>
                <button className="btn-ghost" onClick={loadYouTubeChannel} disabled={ytLoading}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {ytLoading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
                  Refresh
                </button>
                <button className="btn-ghost" onClick={handleLogout}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, borderColor: 'rgba(239,68,68,0.3)', color: '#FCA5A5' }}>
                  <LogOut size={13} /> Logout YT
                </button>
              </>
            ) : ytStatus.is_configured ? (
              <a href="http://localhost:8000/auth/youtube/login"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.5rem 1.1rem',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)',
                  border: 'none', borderRadius: 8,
                  color: 'white', fontWeight: 700, fontSize: '0.85rem',
                  textDecoration: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
                }}>
                <Youtube size={15} />
                Login dengan YouTube
              </a>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#64748B', padding: '0.4rem 0.75rem', background: 'rgba(100,116,139,0.1)', borderRadius: 6 }}>
                ⚙️ Belum dikonfigurasi
              </span>
            )}
          </div>
        </div>

        {/* Channel Video Selector (OAuth Connected) */}
        {ytStatus.is_authenticated && ytVideos.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>
                <Wifi size={11} style={{ marginRight: 4 }} />
                Pilih Video dari Channel Anda (Real-Time)
              </label>
              <select
                className="input-dark"
                onChange={(e) => handleSelectYtVideo(e.target.value)}
                defaultValue=""
                style={{ fontSize: '0.85rem' }}
                disabled={ytSyncLoading}
              >
                <option value="" disabled>-- Pilih video untuk memuat metrik otomatis --</option>
                {ytVideos.map(v => (
                  <option key={v.video_id} value={v.video_id}>
                    {v.title?.length > 55 ? `${v.title.substring(0, 55)}...` : v.title}
                    {` (${v.views?.toLocaleString()} views)`}
                  </option>
                ))}
              </select>
            </div>
            {ytSyncLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: '0.8rem', paddingBottom: 6 }}>
                <Loader size={14} className="spin" />
                Mengambil analytics real-time...
              </div>
            )}
          </div>
        )}

        {/* CSV Fallback (not authenticated) */}
        {!ytStatus.is_authenticated && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>
                Video Sampel (Dataset Lokal)
              </label>
              <select className="input-dark" onChange={(e) => handleCsvSync(e.target.value)} defaultValue="" style={{ fontSize: '0.85rem' }}>
                <option value="" disabled>-- Pilih dari data sampel --</option>
                {csvVideos.map(v => (
                  <option key={v.video_id} value={v.video_id}>
                    {v.judul_video?.length > 50 ? `${v.judul_video.substring(0, 50)}...` : v.judul_video}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600, paddingBottom: 6 }}>ATAU</div>
            <div style={{ flex: 1.2, minWidth: 260, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>Link / ID Video YouTube</label>
                <input className="input-dark" placeholder="https://youtube.com/watch?v=..." value={syncInput}
                  onChange={e => setSyncInput(e.target.value)} style={{ fontSize: '0.85rem' }} />
              </div>
              <button className="btn-ghost" onClick={() => handleCsvSync(syncInput)} disabled={syncLoading || !syncInput.trim()}
                style={{ padding: '0.55rem 0.9rem', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
                {syncLoading ? <Loader size={13} className="spin" /> : <RefreshCw size={13} />}
                Sync
              </button>
            </div>
          </div>
        )}

        {/* Status Message */}
        {ytMessage && (
          <div style={{
            fontSize: '0.8rem', padding: '0.5rem 0.75rem', borderRadius: 8,
            background: ytMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : ytMessage.type === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(100,116,139,0.08)',
            border: `1px solid ${ytMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : ytMessage.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(100,116,139,0.2)'}`,
            color: ytMessage.type === 'success' ? '#A7F3D0' : ytMessage.type === 'error' ? '#FCA5A5' : '#94A3B8',
          }}>
            {ytMessage.text}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <MetricCard icon={Eye}               label="Views Saat Ini" value={form.views.toLocaleString()}  color="#06B6D4" />
        <MetricCard icon={MousePointerClick} label="CTR"            value={`${form.ctr}%`}               color="#10B981" />
        <MetricCard icon={Users}             label="Subs Gained"    value={form.subscriber_gained}       color="#F59E0B" />
        <MetricCard icon={TrendingUp}        label="Retensi"        value={`${form.retention_rate}%`}   color="#A78BFA" />
      </div>

      {/* Anomaly Alert */}
      {result && <AnomalyAlert anomaly={result.anomaly} />}

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>

        {/* Forecast Chart */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Proyeksi Views</h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B' }}>Horizon 7 / 14 / 30 hari ke depan</p>
          </div>
          {result ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" stroke="#475569" tick={{ fontSize: 12 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 12 }} tickFormatter={v => v.toLocaleString()} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}
                  labelStyle={{ color: '#94A3B8' }}
                  formatter={(v) => [v?.toLocaleString(), 'Views']}
                />
                <Area type="monotone" dataKey="views" stroke="#06B6D4" fill="url(#viewsGrad)" strokeWidth={2} dot={{ fill: '#06B6D4', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.875rem', flexDirection: 'column', gap: 8 }}>
              <Eye size={28} style={{ opacity: 0.3 }} />
              Pilih video atau isi form, lalu klik Prediksi
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(15,23,42,0.5)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem' }}>
                <span className={`badge ${result.status === 'Declining' ? 'badge-red' : result.status === 'Viral' ? 'badge-cyan' : 'badge-green'}`}>
                  {result.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ fontSize: '0.83rem', color: '#CBD5E1', lineHeight: 1.6 }}>{result.recommendation}</p>
            </div>
          )}
        </div>

        {/* Prediction Form */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Metrik Video</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              { name: 'views',                  label: 'Views',             type: 'number' },
              { name: 'ctr',                    label: 'CTR (%)',            type: 'number', step: '0.01' },
              { name: 'impressions',            label: 'Impressions',       type: 'number' },
              { name: 'avg_view_duration',      label: 'Avg Duration',      type: 'text', placeholder: 'HH:MM:SS' },
              { name: 'video_duration',         label: 'Durasi Video',      type: 'text', placeholder: 'HH:MM:SS' },
              { name: 'likes',                  label: 'Likes',             type: 'number' },
              { name: 'comments',               label: 'Komentar',          type: 'number' },
              { name: 'retention_rate',         label: 'Retensi (%)',       type: 'number', step: '0.01' },
              { name: 'subscriber_gained',      label: 'Subs Gained',       type: 'number' },
              { name: 'video_age_days',         label: 'Usia Video (hari)', type: 'number' },
              { name: 'lag_views_7d',           label: 'Views 7 Hari Lalu', type: 'number' },
              { name: 'rolling_mean_views_14d', label: 'Avg 14 Hari',      type: 'number' },
            ].map(({ name, label, type, step, placeholder }) => (
              <div key={name}>
                <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 3 }}>{label}</label>
                <input
                  className="input-dark"
                  type={type} name={name} value={form[name] ?? ''}
                  onChange={handleChange} step={step} placeholder={placeholder}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ fontSize: '0.78rem', color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <Loader size={15} className="spin" /> : <Send size={15} />}
              {loading ? 'Memproses...' : 'Prediksi Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
