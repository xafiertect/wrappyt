import { useState, useEffect } from 'react';
import { predictPerformance, getYoutubeVideos, syncYoutubeVideo } from '../services/api';
import MetricCard from '../components/MetricCard';
import AnomalyAlert from '../components/AnomalyAlert';
import { Eye, MousePointerClick, TrendingUp, Users, Send, Loader, RefreshCw, Youtube } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart, Legend,
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

  // Auto-sync states
  const [sampleVideos, setSampleVideos] = useState([]);
  const [syncInput, setSyncInput]       = useState('');
  const [syncLoading, setSyncLoading]   = useState(false);
  const [syncMessage, setSyncMessage]   = useState(null);

  useEffect(() => {
    // Load sample videos from abis_cleaning.csv
    getYoutubeVideos()
      .then(res => setSampleVideos(res.data.data || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: isNaN(value) ? value : Number(value) }));
  };

  const handleSync = async (idOrUrl) => {
    if (!idOrUrl) return;
    setSyncLoading(true);
    setSyncMessage(null);
    try {
      const res = await syncYoutubeVideo(idOrUrl);
      if (res.data?.status === 'success') {
        setForm(res.data.metrics);
        setSyncMessage({
          type: 'success',
          text: `Berhasil tersinkronisasi! Judul: "${res.data.video_title}" ${res.data.is_fallback ? '(Menggunakan sampel data)' : ''}`
        });
      }
    } catch (err) {
      setSyncMessage({ type: 'error', text: err.message || 'Gagal sinkronisasi data YouTube.' });
    } finally {
      setSyncLoading(false);
    }
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

  // Build forecast chart data from result
  const chartData = result ? [
    { label: 'Saat Ini',  views: form.views },
    { label: '7 Hari',    views: result.predicted_views?.days_7 },
    { label: '14 Hari',   views: result.predicted_views?.days_14 },
    { label: '30 Hari',   views: result.predicted_views?.days_30 },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>
          Dashboard Performa
        </h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>
          Prediksi views &amp; deteksi anomali berbasis Machine Learning
        </p>
      </div>

      {/* Auto-sync YouTube Integration Panel */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        border: '1px solid rgba(6,182,212,0.25)',
        background: 'rgba(6,182,212,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Youtube size={17} color="#EF4444" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#F8FAFC' }}>Sinkronisasi Data Otomatis</div>
            <div style={{ fontSize: '0.78rem', color: '#94A3B8' }}>Pilih dari channel atau masukkan ID/Link video YouTube Anda</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Dropdown Sample Videos */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>Video di Channel Anda</label>
            <select
              className="input-dark"
              onChange={(e) => handleSync(e.target.value)}
              defaultValue=""
              style={{ fontSize: '0.85rem' }}
            >
              <option value="" disabled>-- Pilih Video Dari Channel --</option>
              {sampleVideos.map(v => (
                <option key={v.video_id} value={v.video_id}>
                  {v.judul_video.length > 50 ? `${v.judul_video.substring(0, 50)}...` : v.judul_video}
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem' }}>ATAU</div>

          {/* Input Link / ID */}
          <div style={{ flex: 1.2, minWidth: 280, display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>Link Video atau ID YouTube</label>
              <input
                className="input-dark"
                placeholder="Contoh: https://www.youtube.com/watch?v=..."
                value={syncInput}
                onChange={(e) => setSyncInput(e.target.value)}
                style={{ fontSize: '0.85rem', padding: '0.55rem 0.75rem' }}
              />
            </div>
            <button
              className="btn-ghost"
              onClick={() => handleSync(syncInput)}
              disabled={syncLoading || !syncInput.trim()}
              style={{
                padding: '0.6rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.08)'
              }}
            >
              {syncLoading ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
              {syncLoading ? 'Sync...' : 'Sync'}
            </button>
          </div>
        </div>

        {syncMessage && (
          <div style={{
            fontSize: '0.8rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: syncMessage.type === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${syncMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: syncMessage.type === 'success' ? '#A7F3D0' : '#FCA5A5'
          }}>
            {syncMessage.text}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <MetricCard icon={Eye}            label="Views Saat Ini"   value={form.views.toLocaleString()}  color="#06B6D4" />
        <MetricCard icon={MousePointerClick} label="CTR"          value={`${form.ctr}%`}                color="#10B981" />
        <MetricCard icon={Users}          label="Subs Gained"      value={form.subscriber_gained}        color="#F59E0B" />
        <MetricCard icon={TrendingUp}     label="Retensi"          value={`${form.retention_rate}%`}    color="#A78BFA" />
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
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.875rem' }}>
              Isi form atau sinkronisasikan video di atas, kemudian klik Prediksi.
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(15,23,42,0.5)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem' }}>
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
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Metrik Video Terisi</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {[
              { name: 'views',              label: 'Views',             type: 'number' },
              { name: 'ctr',                label: 'CTR (%)',            type: 'number', step: '0.01' },
              { name: 'impressions',        label: 'Impressions',       type: 'number' },
              { name: 'avg_view_duration',  label: 'Avg Duration',      type: 'text', placeholder: 'HH:MM:SS' },
              { name: 'video_duration',     label: 'Durasi Video',      type: 'text', placeholder: 'HH:MM:SS' },
              { name: 'likes',              label: 'Likes',             type: 'number' },
              { name: 'comments',           label: 'Komentar',          type: 'number' },
              { name: 'retention_rate',     label: 'Retensi (%)',       type: 'number', step: '0.01' },
              { name: 'subscriber_gained',  label: 'Subs Gained',       type: 'number' },
              { name: 'video_age_days',     label: 'Usia Video (hari)', type: 'number' },
              { name: 'lag_views_7d',       label: 'Views 7 Hari Lalu', type: 'number' },
              { name: 'rolling_mean_views_14d', label: 'Avg 14 Hari',  type: 'number' },
            ].map(({ name, label, type, step, placeholder }) => (
              <div key={name}>
                <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 4 }}>{label}</label>
                <input
                  className="input-dark"
                  type={type}
                  name={name}
                  value={form[name] ?? ''}
                  onChange={handleChange}
                  step={step}
                  placeholder={placeholder}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ fontSize: '0.78rem', color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? <Loader size={15} className="spin" /> : <Send size={15} />}
              {loading ? 'Memproses...' : 'Prediksi Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
