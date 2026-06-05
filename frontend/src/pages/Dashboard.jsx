import { useState, useEffect } from 'react';
import { predictPerformance, getYouTubeStatus, getYouTubeChannel, getVideoMetrics, logoutYouTube, getYoutubeVideos, syncYoutubeVideo, suggestThumbnail } from '../services/api';
import MetricCard from '../components/MetricCard';
import AnomalyAlert from '../components/AnomalyAlert';
import { Eye, MousePointerClick, TrendingUp, Users, Send, Loader, RefreshCw, Youtube, LogOut, CheckCircle, Wifi, Image, Sparkles, Download, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

// ── CTR Thumbnail Generator Panel ─────────────────────────────────────────────
function CTRThumbnailPanel({ currentCtr = 0 }) {
  const [open,           setOpen]           = useState(false);
  const [form,           setForm]           = useState({ video_title: '', description: '' });
  const [suggestion,     setSuggestion]     = useState(null);
  const [editSuggestion, setEditSuggestion] = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [imageLoading,   setImageLoading]   = useState(false);
  const [imageUrl,       setImageUrl]       = useState(null);
  const [error,          setError]          = useState(null);

  const ctrLabel =
    currentCtr < 2   ? { text: 'Rendah', color: '#EF4444' }
    : currentCtr < 4 ? { text: 'Rata-rata', color: '#F59E0B' }
    :                  { text: 'Baik', color: '#10B981' };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setImageUrl(null); setSuggestion(null);
    try {
      const res = await suggestThumbnail({
        video_title:  form.video_title,
        description:  form.description,
        content_type: 'Edukatif',
        current_ctr:  currentCtr,
      });
      setSuggestion(res.data);
      setEditSuggestion({
        ...res.data,
        color_palette: res.data.color_palette || ['#FF0055', '#FFDD00', '#FFFFFF', '#1D1E2C'],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, val) =>
    setEditSuggestion(prev => ({ ...prev, [field]: val }));

  const handleColorChange = (index, color) => {
    const next = [...editSuggestion.color_palette];
    next[index] = color;
    setEditSuggestion(prev => ({ ...prev, color_palette: next }));
  };

  const handleGenerateImage = () => {
    if (!editSuggestion) return;
    setImageLoading(true);
    const prompt = [
      '16:9 professional YouTube thumbnail, ultra-detailed, cinematic lighting.',
      `Main element: ${editSuggestion.main_element}.`,
      `Background: ${editSuggestion.background_description || editSuggestion.background_color}.`,
      `Bold text overlay in ${editSuggestion.text_color}: "${editSuggestion.text_overlay}".`,
      `Facial expression: ${editSuggestion.facial_expression}.`,
      `${editSuggestion.composition_tip}.`,
      `Color palette: ${editSuggestion.color_palette.join(', ')}.`,
      'High CTR design, vibrant, clean graphics, 4K quality.',
    ].join(' ');
    const seed = Math.floor(Math.random() * 1_000_000);
    setImageUrl(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}`
    );
  };

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res  = await fetch(imageUrl);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `thumbnail_ctr_${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch { window.open(imageUrl, '_blank'); }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', border: '1px solid rgba(245,158,11,0.25)', background: 'var(--panel-dark)', transition: 'background-color 0.4s ease, border-color 0.4s ease' }}>
      {/* ── Header (collapsible) */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', transition: 'color 0.4s' }}>
              CTR Thumbnail Generator
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, transition: 'color 0.4s' }}>
              Desain thumbnail berdasarkan performa CTR Anda
              <span style={{ background: `${ctrLabel.color}18`, color: ctrLabel.color, border: `1px solid ${ctrLabel.color}30`, borderRadius: 4, padding: '1px 6px', fontSize: '0.7rem', fontWeight: 700 }}>
                CTR {currentCtr}% — {ctrLabel.text}
              </span>
            </div>
          </div>
        </div>
        {open ? <ChevronUp size={16} color="var(--text-dim)" /> : <ChevronDown size={16} color="var(--text-dim)" />}
      </button>

      {/* ── Body */}
      {open && (
        <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* Kolom Kiri: Form + Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Form Input */}
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                  📝 Judul Video <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <input
                  className="input-dark"
                  value={form.video_title}
                  onChange={e => setForm(f => ({ ...f, video_title: e.target.value }))}
                  placeholder="Contoh: 5 Cara Naik Views 10x Lipat dalam Seminggu"
                  required
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
                  📄 Deskripsi Konten
                </label>
                <textarea
                  className="input-dark"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Singkat tentang isi video — AI akan pakai ini untuk menyesuaikan desain thumbnail..."
                  rows={3}
                  style={{ fontSize: '0.85rem', resize: 'vertical', width: '100%' }}
                />
              </div>

              {/* CTR context badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0.75rem', background: 'var(--bg-badge)', border: '1px solid var(--border-glass)', borderRadius: 8, fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                <MousePointerClick size={13} />
                <span>AI akan mendesain untuk CTR <strong>{currentCtr}%</strong> — menargetkan peningkatan klik maksimal</span>
              </div>

              {error && (
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
                  {error}
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, var(--accent-gold) 0%, #D97706 100%)' }}>
                {loading ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {loading ? 'AI Menganalisis...' : 'Generate Saran Desain'}
              </button>
            </form>

            {/* Editor Kustomisasi */}
            {editSuggestion && (
              <div className="glass-panel" style={{ padding: '1.1rem', border: '1px solid rgba(6,182,212,0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: 2 }}>
                  🎨 Edit Saran Desain
                </h3>

                {/* Elemen Utama */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>🖼 Detail Gambar / Elemen Utama</label>
                  <textarea className="input-dark" value={editSuggestion.main_element} onChange={e => handleFieldChange('main_element', e.target.value)} rows={2} style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }} />
                </div>

                {/* Background Description */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>🌅 Deskripsi Background</label>
                  <textarea className="input-dark" value={editSuggestion.background_description} onChange={e => handleFieldChange('background_description', e.target.value)} rows={2} style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }} />
                </div>

                {/* Warna Background + Warna Teks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>🎨 Warna Background</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="color" value={editSuggestion.background_color?.startsWith('#') ? editSuggestion.background_color : '#1A1A2E'} onChange={e => handleFieldChange('background_color', e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border-glass)', cursor: 'pointer', padding: 0 }} />
                      <input className="input-dark" value={editSuggestion.background_color} onChange={e => handleFieldChange('background_color', e.target.value)} style={{ flex: 1, fontSize: '0.78rem' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>✏️ Warna Teks</label>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="color" value={editSuggestion.text_color?.startsWith('#') ? editSuggestion.text_color : '#FFFFFF'} onChange={e => handleFieldChange('text_color', e.target.value)} style={{ width: 32, height: 32, borderRadius: 6, border: '2px solid var(--border-glass)', cursor: 'pointer', padding: 0 }} />
                      <input className="input-dark" value={editSuggestion.text_color} onChange={e => handleFieldChange('text_color', e.target.value)} style={{ flex: 1, fontSize: '0.78rem' }} />
                    </div>
                  </div>
                </div>

                {/* Teks Overlay + Ekspresi */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>📝 Teks Overlay</label>
                    <input className="input-dark" value={editSuggestion.text_overlay} onChange={e => handleFieldChange('text_overlay', e.target.value)} style={{ width: '100%', fontSize: '0.8rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>😊 Ekspresi Wajah</label>
                    <input className="input-dark" value={editSuggestion.facial_expression} onChange={e => handleFieldChange('facial_expression', e.target.value)} style={{ width: '100%', fontSize: '0.8rem' }} />
                  </div>
                </div>

                {/* Komposisi */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>📐 Tips Komposisi</label>
                  <textarea className="input-dark" value={editSuggestion.composition_tip} onChange={e => handleFieldChange('composition_tip', e.target.value)} rows={2} style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }} />
                </div>

                {/* Palet Warna */}
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>🌈 Palet Warna</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {editSuggestion.color_palette.map((c, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <input type="color" value={c.startsWith('#') ? c : '#FFFFFF'} onChange={e => handleColorChange(i, e.target.value)}
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid var(--border-glass)', cursor: 'pointer', padding: 0 }}
                          title={c}
                        />
                        <button type="button" onClick={() => setEditSuggestion(p => ({ ...p, color_palette: p.color_palette.filter((_, idx) => idx !== i) }))}
                          style={{ position: 'absolute', top: -4, right: -4, width: 13, height: 13, borderRadius: '50%', background: 'var(--accent-red)', color: '#FFF', border: 'none', fontSize: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ×
                        </button>
                      </div>
                    ))}
                    {editSuggestion.color_palette.length < 6 && (
                      <button type="button" onClick={() => setEditSuggestion(p => ({ ...p, color_palette: [...p.color_palette, '#06B6D4'] }))}
                        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px dashed var(--text-dim)', background: 'var(--bg-hover)', color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        +
                      </button>
                    )}
                  </div>
                </div>

                {/* Generate Image Button */}
                <button className="btn-primary" type="button" onClick={handleGenerateImage}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891B2 100%)', marginTop: 4 }}>
                  <Sparkles size={14} />
                  Generate Gambar Thumbnail
                </button>
              </div>
            )}
          </div>

          {/* Kolom Kanan: Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'flex-start' }}>
            {imageUrl ? (
              <>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>📺 Preview Thumbnail</h3>

                {/* 16:9 Mockup */}
                <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: 'var(--bg-dark)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: 'var(--shadow-premium)' }}>
                  {imageLoading && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,15,25,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 10 }}>
                      <Loader className="animate-spin" size={28} color="var(--accent-gold)" />
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>AI sedang melukis thumbnail...</span>
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt="Thumbnail Preview"
                    onLoad={() => setImageLoading(false)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* YouTube-style progress bar overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 36, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', display: 'flex', alignItems: 'center', padding: '0 10px', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--border-glass)' }}>
                      <div style={{ width: '35%', height: '100%', background: 'var(--accent-red)' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '8px solid white' }} />
                      <span style={{ fontSize: '0.68rem', color: '#CBD5E1' }}>0:00 / 10:00</span>
                    </div>
                    <span style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: 3, fontSize: '0.62rem', color: '#FFF', fontWeight: 700, marginTop: 4 }}>10:00</span>
                  </div>
                </div>

                {/* Saran desain card */}
                {editSuggestion && (
                  <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '0.9rem', border: '1px solid var(--border-glass)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1.2rem' }}>
                      <span><strong style={{ color: 'var(--text-primary)' }}>Background:</strong> <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: editSuggestion.background_color, verticalAlign: 'middle', marginRight: 4, border: '1px solid var(--border-glass)' }} />{editSuggestion.background_color}</span>
                      <span><strong style={{ color: 'var(--text-primary)' }}>Teks:</strong> <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: editSuggestion.text_color, verticalAlign: 'middle', marginRight: 4, border: '1px solid var(--border-glass)' }} />{editSuggestion.text_color}</span>
                    </div>
                    <div style={{ marginTop: 6 }}><strong style={{ color: 'var(--text-primary)' }}>Overlay:</strong> "{editSuggestion.text_overlay}"</div>
                    <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {editSuggestion.color_palette.map((c, i) => (
                        <span key={i} style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid var(--border-glass)' }} title={c} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem' }}>
                  <button className="btn-primary" onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: '0.82rem' }}>
                    <Download size={13} /> Unduh JPG
                  </button>
                  <button className="btn-ghost" onClick={handleGenerateImage} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', border: '1px solid var(--border-glass)' }}>
                    <RefreshCw size={13} /> Ulang
                  </button>
                </div>
              </>
            ) : suggestion ? (
              /* Waiting for image generation */
              <div style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: '2rem', textAlign: 'center', gap: 12 }}>
                <Sparkles size={36} color="var(--accent-gold)" style={{ opacity: 0.8 }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>Saran Desain Siap!</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 260 }}>
                  Edit detail di kolom kiri jika perlu, lalu klik <strong style={{ color: 'var(--accent-cyan)' }}>Generate Gambar Thumbnail</strong>
                </p>
                <button className="btn-primary" onClick={handleGenerateImage} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891B2 100%)', fontSize: '0.83rem' }}>
                  <Sparkles size={13} /> Generate Sekarang
                </button>
              </div>
            ) : (
              /* Empty state */
              <div style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 12, border: '1px dashed var(--border-glass)', color: 'var(--text-dim)', textAlign: 'center', gap: 10 }}>
                <Image size={36} style={{ opacity: 0.25 }} />
                <p style={{ fontSize: '0.83rem' }}>Isi form & klik <strong>Generate Saran Desain</strong></p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', maxWidth: 220 }}>AI akan membuat rekomendasi thumbnail yang dioptimalkan berdasarkan CTR kamu</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const defaultForm = {
  views: 15000, ctr: 4.5, impressions: 200000,
  avg_view_duration: '00:03:30', video_duration: '00:10:00',
  likes: 500, comments: 120, retention_rate: 35.0,
  subscriber_gained: 50, video_age_days: 5, video_age_hours: 120,
  lag_views_7d: 12000, rolling_mean_views_14d: 11000,
};

// Hippo Academy rule: Viral ≥2k/2h | Normal 1k–2k/2h | Tidak Viral <1k/2h
const STATUS_COLOR = { Viral: '#06B6D4', Normal: '#F59E0B', 'Tidak Viral': '#EF4444' };

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

  const chartData = result?.predicted_views?.chart_data || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Dashboard Performa</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Prediksi views &amp; deteksi anomali berbasis Machine Learning
        </p>
      </div>

      {/* ── YouTube Integration Panel ─────────────────────────────────────────── */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        border: ytStatus.is_authenticated
          ? '1px solid rgba(16,185,129,0.3)'
          : '1px solid rgba(239,68,68,0.2)',
        background: 'var(--panel-dark)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        transition: 'background-color 0.4s ease, border-color 0.4s ease'
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
                ? <CheckCircle size={18} color="var(--accent-green)" />
                : <Youtube size={18} color="var(--accent-red)" />
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                {ytStatus.is_authenticated ? 'Terhubung dengan YouTube' : 'Hubungkan Akun YouTube'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
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
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5, borderColor: 'rgba(239,68,68,0.3)', color: 'var(--accent-red)' }}>
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
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '0.4rem 0.75rem', background: 'var(--bg-badge)', borderRadius: 6 }}>
                ⚙️ Belum dikonfigurasi
              </span>
            )}
          </div>
        </div>

        {/* Channel Video Selector (OAuth Connected) */}
        {ytStatus.is_authenticated && ytVideos.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.8rem', paddingBottom: 6 }}>
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>
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
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, paddingBottom: 6 }}>ATAU</div>
            <div style={{ flex: 1.2, minWidth: 260, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Link / ID Video YouTube</label>
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
            border: `1px solid ${ytMessage.type === 'success' ? 'rgba(16,185,129,0.25)' : ytMessage.type === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(100,116,139,0.25)'}`,
            color: ytMessage.type === 'success' ? 'var(--accent-green)' : ytMessage.type === 'error' ? 'var(--accent-red)' : 'var(--text-muted)',
          }}>
            {ytMessage.text}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <MetricCard icon={Eye}               label="Views Saat Ini" value={form.views.toLocaleString()}  color="var(--accent-cyan)" />
        <MetricCard icon={MousePointerClick} label="CTR"            value={`${form.ctr}%`}               color="var(--accent-green)" />
        <MetricCard icon={Users}             label="Subs Gained"    value={form.subscriber_gained}       color="var(--accent-gold)" />
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
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Horizon 1 / 2 / 3 hari ke depan (Detail per jam antara Hari 1-2)</p>
          </div>
          {result ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--accent-cyan)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                <XAxis dataKey="label" stroke="var(--text-dim)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12 }} tickFormatter={v => v.toLocaleString()} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                  formatter={(v) => [v?.toLocaleString(), 'Views']}
                />
                <Area type="monotone" dataKey="views" stroke="var(--accent-cyan)" fill="url(#viewsGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.875rem', flexDirection: 'column', gap: 8 }}>
              <Eye size={28} style={{ opacity: 0.3 }} />
              Pilih video atau isi form, lalu klik Prediksi
            </div>
          )}

          {result && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-badge)', borderRadius: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                <span className={`badge ${result.status === 'Tidak Viral' ? 'badge-red' : result.status === 'Viral' ? 'badge-cyan' : 'badge-yellow'}`}
                  style={{ background: STATUS_COLOR[result.status] + '22', color: STATUS_COLOR[result.status], border: `1px solid ${STATUS_COLOR[result.status]}55` }}>
                  {result.status === 'Viral' ? '🚀 ' : result.status === 'Tidak Viral' ? '📉 ' : '📊 '}
                  {result.status}
                </span>
                {result.is_viral && (
                  <span style={{ fontSize: '0.72rem', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>
                    IS VIRAL ✓
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.recommendation}</p>
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
              { name: 'subscriber_gained',      label: 'Subs Gained',            type: 'number' },
              { name: 'video_age_days',         label: 'Usia Video (hari)',      type: 'number' },
              { name: 'video_age_hours',        label: 'Usia Video (jam) ⏱️',   type: 'number', placeholder: 'Contoh: 2, 24, 120' },
              { name: 'lag_views_7d',           label: 'Views 7 Hari Lalu',      type: 'number' },
              { name: 'rolling_mean_views_14d', label: 'Avg 14 Hari',      type: 'number' },
            ].map(({ name, label, type, step, placeholder }) => (
              <div key={name}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>{label}</label>
                <input
                  className="input-dark"
                  type={type} name={name} value={form[name] ?? ''}
                  onChange={handleChange} step={step} placeholder={placeholder}
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>
            ))}

            {error && (
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>
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

      {/* ── CTR Thumbnail Generator ─────────────────────────────────────────── */}
      <CTRThumbnailPanel currentCtr={form.ctr} />
    </div>
  );
}
