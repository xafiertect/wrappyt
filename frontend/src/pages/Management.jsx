import { useState, useEffect } from 'react';
import { getOptimalSchedule, suggestThumbnail, getDrafts, createDraft, deleteDraft } from '../services/api';
import { Image, Clock, FileText, Plus, Trash2, Loader, Star } from 'lucide-react';

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

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      const res = await suggestThumbnail(form);
      setResult(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: 6 }}>Judul Video</label>
            <input className="input-dark" value={form.video_title} onChange={e => setForm(f => ({ ...f, video_title: e.target.value }))} placeholder="Contoh: Cara Naik Subscribers 1000 Orang" required />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: 6 }}>Tipe Konten</label>
            <select className="input-dark" value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))}>
              {['Edukatif', 'Tutorial', 'Vlog', 'Review', 'Motivasi', 'Hiburan'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: '#64748B', display: 'block', marginBottom: 6 }}>Target Audiens</label>
            <input className="input-dark" value={form.target_audience} onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))} placeholder="Contoh: Kreator YouTube pemula" />
          </div>
          {error && <div style={{ fontSize: '0.8rem', color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 0.75rem', borderRadius: 8 }}>{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {loading ? <Loader size={14} /> : <Image size={14} />}
            {loading ? 'Generating...' : 'Generate Saran Thumbnail'}
          </button>
        </form>
      </div>

      <div>
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { label: '🖼 Elemen Utama',    value: result.main_element },
              { label: '📝 Teks Overlay',     value: result.text_overlay },
              { label: '😊 Ekspresi Wajah',   value: result.facial_expression },
              { label: '📐 Komposisi',         value: result.composition_tip },
              { label: '🎨 Background',        value: result.background_color },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'rgba(15,23,42,0.5)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748B', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: '0.875rem', color: '#E2E8F0' }}>{value}</div>
              </div>
            ))}
            {result.color_palette?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.color_palette.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', textAlign: 'center' }}>
            <div>
              <Image size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>Saran desain thumbnail akan muncul di sini</p>
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

  if (error) return <div style={{ color: '#EF4444', fontSize: '0.875rem' }}>{error}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {slots.map((slot, i) => (
        <div key={i} className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `3px solid hsl(${180 + slot.score}deg, 80%, 55%)` }}>
          <div style={{ minWidth: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#F8FAFC' }}>{i + 1}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 3 }}>{slot.day} — {slot.time_wib} WIB</div>
            <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{slot.reason}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={14} color="#F59E0B" fill="#F59E0B" />
            <span style={{ fontWeight: 700, color: '#F59E0B' }}>{slot.score}</span>
          </div>
        </div>
      ))}
      {tip && (
        <div style={{ background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#7DD3FC', lineHeight: 1.7 }}>
          💡 {tip}
        </div>
      )}
    </div>
  );
}

// ── Drafts Tab ────────────────────────────────────────────────────────────────
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

  const STATUS_COLOR = { Draft: '#F59E0B', 'Ready to Post': '#10B981', Scheduled: '#06B6D4' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem' }}>
      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>Tambah Draf Baru</h3>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>Judul Video</label>
          <input className="input-dark" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul draf video..." required />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: '#64748B', display: 'block', marginBottom: 5 }}>Outline Skrip</label>
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
            <div style={{ textAlign: 'center', color: '#334155', padding: '2rem' }}>
              <FileText size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p style={{ fontSize: '0.85rem' }}>Belum ada draf. Buat yang pertama!</p>
            </div>
          ) : drafts.map(d => (
            <div key={d.id} className="glass-panel" style={{ padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, color: '#E2E8F0' }}>{d.title}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="badge" style={{ background: `${STATUS_COLOR[d.status]}18`, color: STATUS_COLOR[d.status], border: `1px solid ${STATUS_COLOR[d.status]}30`, fontSize: '0.7rem', padding: '2px 8px' }}>
                    {d.status}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#475569' }}>{new Date(d.created_at).toLocaleDateString('id-ID')}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(d.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 6, borderRadius: 6, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
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
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Tools pengelolaan konten Hippo Academy</p>
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
