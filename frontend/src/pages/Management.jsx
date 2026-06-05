import { useState, useEffect } from 'react';
import { getOptimalSchedule, suggestThumbnail, getDrafts, createDraft, deleteDraft } from '../services/api';
import { Image, Clock, FileText, Plus, Trash2, Loader, Star, Download, RefreshCw, Sparkles } from 'lucide-react';

const TABS = [
  { id: 'thumbnail', label: 'Thumbnail Helper', icon: Image },
  { id: 'schedule',  label: 'Jam Posting',      icon: Clock },
  { id: 'drafts',    label: 'Draft Manager',     icon: FileText },
];

// ── Thumbnail Tab ─────────────────────────────────────────────────────────────
function ThumbnailTab() {
  const [form,    setForm]    = useState({ video_title: '', content_type: 'Edukatif', target_audience: 'Kreator YouTube' });
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // States untuk edit manual & render gambar
  const [editableResult, setEditableResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null); setGeneratedImageUrl(null);
    try {
      const res = await suggestThumbnail(form);
      setResult(res.data);
      setEditableResult({
        ...res.data,
        color_palette: res.data.color_palette || ["#FF0055", "#FFFFFF", "#1D1E2C"]
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleFieldChange = (field, val) => {
    setEditableResult(prev => ({ ...prev, [field]: val }));
  };

  const handleColorChange = (index, color) => {
    const newPalette = [...editableResult.color_palette];
    newPalette[index] = color;
    setEditableResult(prev => ({ ...prev, color_palette: newPalette }));
  };

  const handleAddColor = () => {
    setEditableResult(prev => ({
      ...prev,
      color_palette: [...prev.color_palette, '#06B6D4']
    }));
  };

  const handleRemoveColor = (index) => {
    const newPalette = editableResult.color_palette.filter((_, i) => i !== index);
    setEditableResult(prev => ({ ...prev, color_palette: newPalette }));
  };

  const handleGenerateImage = () => {
    if (!editableResult) return;
    setImageLoading(true);
    
    const promptText = `16:9 ultra-detailed professional YouTube thumbnail. Main element: ${editableResult.main_element}. Text overlay bold: '${editableResult.text_overlay}'. Facial expression: ${editableResult.facial_expression}. Background: ${editableResult.background_color}. Palette: ${editableResult.color_palette.join(", ")}. ${editableResult.composition_tip}. YouTube thumbnail, clean graphics, vibrant colors, epic composition, 4k, cinematic lighting.`;
    
    const encodedPrompt = encodeURIComponent(promptText);
    const randomSeed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&nologo=true&seed=${randomSeed}`;
    
    setGeneratedImageUrl(imageUrl);
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `thumbnail_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      window.open(generatedImageUrl, '_blank');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Kolom Kiri: Form Input & Editor Saran */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Judul Video</label>
            <input className="input-dark" value={form.video_title} onChange={e => setForm(f => ({ ...f, video_title: e.target.value }))} placeholder="Contoh: Cara Naik Subscribers 1000 Orang" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Tipe Konten</label>
              <select className="input-dark" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
                {['Edukatif', 'Tutorial', 'Vlog', 'Review', 'Motivasi', 'Hiburan'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Target Audiens</label>
              <input className="input-dark" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="Contoh: Kreator YouTube pemula" />
            </div>
          </div>
          {error && <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.08)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <Loader size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {loading ? 'Menganalisis...' : 'Generate Saran Thumbnail'}
          </button>
        </form>

        {/* Editor Kustomisasi Detail */}
        {editableResult && (
          <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              🎨 Kustomisasi Detail Thumbnail
            </h3>
            
            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}> Elemen Utama</label>
              <textarea className="input-dark" value={editableResult.main_element} onChange={e => handleFieldChange('main_element', e.target.value)} rows={2} style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>📝 Teks Overlay</label>
                <input className="input-dark" value={editableResult.text_overlay} onChange={e => handleFieldChange('text_overlay', e.target.value)} style={{ width: '100%', fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>😊 Ekspresi Wajah</label>
                <input className="input-dark" value={editableResult.facial_expression} onChange={e => handleFieldChange('facial_expression', e.target.value)} style={{ width: '100%', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>📐 Komposisi</label>
              <textarea className="input-dark" value={editableResult.composition_tip} onChange={e => handleFieldChange('composition_tip', e.target.value)} rows={2} style={{ width: '100%', fontSize: '0.8rem', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>🎨 Background</label>
                <input className="input-dark" value={editableResult.background_color} onChange={e => handleFieldChange('background_color', e.target.value)} style={{ width: '100%', fontSize: '0.8rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>🌈 Palet Warna (Klik & Atur)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                  {editableResult.color_palette.map((c, i) => (
                    <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                      <input 
                        type="color" 
                        value={c.startsWith('#') ? c : '#FFFFFF'} 
                        onChange={e => handleColorChange(i, e.target.value)} 
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          border: '2px solid var(--border-glass)',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'none'
                        }}
                        title={c}
                      />
                      <button 
                        type="button"
                        onClick={() => handleRemoveColor(i)}
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          background: 'var(--accent-red)',
                          color: '#FFF',
                          border: 'none',
                          fontSize: 9,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {editableResult.color_palette.length < 6 && (
                    <button 
                      type="button" 
                      onClick={handleAddColor}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: '1px dashed var(--border-glass)',
                        background: 'var(--bg-badge)',
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button className="btn-primary" type="button" onClick={handleGenerateImage} style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, var(--accent-cyan) 0%, #0891B2 100%)' }}>
              <Sparkles size={14} />
              Render Gambar Thumbnail (AI)
            </button>
          </div>
        )}
      </div>

      {/* Kolom Kanan: Preview Gambar AI & Live Mockup */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
        {generatedImageUrl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>📺 Live Preview YouTube Player</h3>
            
            {/* 16:9 YouTube Video Mockup */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              background: 'var(--bg-dark)',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--border-glass)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              {imageLoading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(11,15,25,0.85)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  zIndex: 10
                }}>
                  <Loader className="animate-spin" size={30} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>AI sedang melukis thumbnail Anda...</span>
                </div>
              )}
              <img 
                src={generatedImageUrl} 
                alt="Thumbnail Preview"
                onLoad={() => setImageLoading(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Controls Overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 40,
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                justifyContent: 'space-between',
                pointerEvents: 'none'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'var(--border-glass)'
                }}>
                  <div style={{ width: '35%', height: '100%', background: 'var(--accent-red)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 0, height: 0, borderTop: '5px solid transparent', borderBottom: '5px solid transparent', borderLeft: '10px solid white' }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0:00 / 08:45</span>
                </div>
                <span style={{
                  background: 'rgba(0,0,0,0.8)',
                  padding: '2px 5px',
                  borderRadius: 3,
                  fontSize: '0.65rem',
                  color: 'var(--text-primary)',
                  fontWeight: 'bold'
                }}>
                  08:45
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Download size={14} />
                Unduh Thumbnail (JPG)
              </button>
              <button className="btn-ghost" onClick={handleGenerateImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--border-glass)' }}>
                <RefreshCw size={14} />
                Generate Ulang
              </button>
            </div>
          </div>
        ) : result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-badge)', borderRadius: 12, border: '1px dashed var(--border-glass)', padding: '2rem', textAlign: 'center' }}>
            <Sparkles size={40} color="var(--accent-cyan)" style={{ marginBottom: 8, opacity: 0.8 }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Saran Desain Berhasil Dibuat!</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 300, marginBottom: 12 }}>
              Sesuaikan detail desain di kolom kiri jika diperlukan, lalu klik **Render Gambar Thumbnail** untuk melihat visualisasinya!
            </p>
            <button className="btn-primary" onClick={handleGenerateImage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} />
              Render Sekarang
            </button>
          </div>
        ) : (
          <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', textAlign: 'center', border: '1px dashed var(--border-glass)', borderRadius: 12, background: 'var(--bg-badge)' }}>
            <div>
              <Image size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Saran desain & preview thumbnail akan muncul di sini</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab() {
  const [slots,   setSlots]   = useState([]);
  const [tip,     setTip]     = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getOptimalSchedule()
      .then(res => { setSlots(res.data.optimal_slots); setTip(res.data.general_tip); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 10 }} />)}
  </div>;

  if (error) return <div style={{ color: 'var(--accent-red)', fontSize: '0.875rem' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {slots.map((slot, i) => (
        <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid hsl(${180 + slot.score}deg, 80%, 55%)` }}>
          <div style={{ minWidth: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{i + 1}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 3 }}>{slot.day} — {slot.time_wib} WIB</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{slot.reason}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} color="var(--accent-gold)" fill="var(--accent-gold)" />
            <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{slot.score}</span>
          </div>
        </div>
      ))}
      {tip && (
        <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--accent-cyan)', lineHeight: 1.7 }}>
          💡 {tip}
        </div>
      )}
    </div>
  );
}

// ── Drafts Tab ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  'Draft': { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: 'var(--accent-gold)' },
  'Ready to Post': { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', text: 'var(--accent-green)' },
  'Scheduled': { bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', text: 'var(--accent-cyan)' }
};

function DraftsTab() {
  const [drafts,  setDrafts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ title: '', script_outline: '' });
  const [saving,  setSaving]  = useState(false);

  const load = () => getDrafts().then(r => setDrafts(r.data)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createDraft(form); setForm({ title: '', script_outline: '' }); load(); }
    catch {}
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await deleteDraft(id); load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>Tambah Draf Baru</h3>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Judul Video</label>
          <input className="input-dark" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul draf video..." required />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Outline Skrip</label>
          <textarea className="input-dark" value={form.script_outline} onChange={e => setForm(f => ({ ...f, script_outline: e.target.value }))}
            placeholder="Intro → Poin 1 → Poin 2 → CTA"
            rows={4} style={{ resize: 'vertical' }}
          />
        </div>
        <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saving ? <Loader size={14} /> : <Plus size={14} />}
          Simpan Draf
        </button>
      </form>

      {/* Draft List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>
          Daftar Draf ({drafts.length})
        </h3>
        {loading ? [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 10 }} />) :
          drafts.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
              <FileText size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: '0.85rem' }}>Belum ada draf. Buat yang pertama!</p>
            </div>
          ) : drafts.map(d => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG['Draft'];
            return (
              <div key={d.id} className="glass-panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, color: 'var(--text-primary)' }}>{d.title}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="badge" style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, fontSize: '0.7rem', padding: '2px 8px' }}>
                      {d.status}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{new Date(d.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ── Main Management Page ──────────────────────────────────────────────────────
export default function Management() {
  const [activeTab, setActiveTab] = useState('thumbnail');
  const ActiveComponent = { thumbnail: ThumbnailTab, schedule: ScheduleTab, drafts: DraftsTab }[activeTab];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>Management</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Tools pengelolaan konten Hippo Academy</p>
      </div>

      <div className="tab-bar" style={{ maxWidth: 500 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`tab-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            <Icon size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
