import { useState, useRef, useEffect } from 'react';
import { chatConsultation } from '../services/api';
import { Send, Loader, Bot, User, ShieldAlert } from 'lucide-react';

const PRESETS = [
  'Berapa % video channel ini yang viral dan kenapa?',
  'Gimana cara kerja model prediksi views-nya?',
  'CTR channel rata-rata berapa? Bagus atau enggak?',
  'Strategi hook 30 detik pertama yang terbukti efektif',
  'Video mana yang paling berisiko decline?',
  'Cara riset topik yang punya potensi viral tinggi',
  'Kenapa anomali bisa terjadi di channel ini?',
  'Gimana cara nulis judul yang CTR-nya tinggi?',
];

const HARD_BLOCK_PHRASES = [
  'resep masakan', 'cara masak', 'cuaca hari ini', 'ramalan cuaca',
  'harga saham', 'jadwal liga', 'skor bola', 'cara main game',
];

function isHardOffTopic(msg) {
  const lower = msg.toLowerCase();
  return HARD_BLOCK_PHRASES.some(p => lower.includes(p));
}

export default function Consultation() {
  const [messages,  setMessages]  = useState([
    { role: 'ai', text: 'Hei! Gue AI engineer yang ngebangun sistem analitik Hippo Academy ini.\n\nGue punya akses ke data lengkap: 2.356 video dianalisis, model XGBoost buat prediksi views, Isolation Forest buat deteksi anomali, plus semua output dari pipeline ML-nya.\n\nTanya apa aja — strategi konten, cara kerja modelnya, kenapa ada video yang anomali, atau gimana channel ini bisa lebih optimal.' }
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [history,  setHistory]  = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    // Hanya block topik yang benar-benar tidak relevan sama sekali
    if (isHardOffTopic(msg)) {
      setMessages(prev => [...prev,
        { role: 'user', text: msg },
        { role: 'system-warn', text: 'Itu di luar scope gue. Tanya yang nyambung ke konten, YouTube, atau data channel ya.' },
      ]);
      setInput('');
      return;
    }

    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await chatConsultation({ message: msg, history });
      const aiText = res.data?.response || 'Maaf, tidak ada respons dari server.';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
      setHistory(prev => [...prev, { role: 'user', parts: msg }, { role: 'model', parts: aiText }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'error', text: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>AI Consultant</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>AI Engineer — data channel, model ML, strategi konten · Powered by Gemini + RAG</p>
      </div>

      {/* Chat Area */}
      <div className="glass-panel card-3d glow-cyan" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => {
            if (msg.role === 'system-warn') return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, padding: '0.75rem 1rem',
              }}>
                <ShieldAlert size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-red)' }}>{msg.text}</span>
              </div>
            );

            if (msg.role === 'error') return (
              <div key={i} style={{ fontSize: '0.82rem', color: 'var(--accent-red)', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                {msg.text}
              </div>
            );

            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isUser ? 'rgba(6,182,212,0.15)' : 'var(--bg-card)',
                  border: `1px solid ${isUser ? 'rgba(6,182,212,0.3)' : 'var(--border-glass)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isUser ? <User size={15} color="var(--accent-cyan)" /> : <Bot size={15} color="var(--text-muted)" />}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '72%',
                  background: isUser ? 'rgba(6,182,212,0.08)' : 'var(--bg-card)',
                  border: `1px solid ${isUser ? 'rgba(6,182,212,0.15)' : 'var(--border-glass)'}`,
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={15} color="var(--text-muted)" />
              </div>
              <div style={{ display: 'flex', gap: 5, padding: '0.6rem 1rem', background: 'var(--bg-card)', borderRadius: '4px 16px 16px 16px', border: '1px solid var(--border-glass)' }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-cyan)', animation: `bounce 1.2s ${j * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Preset Chips (Scroll horizontally on mobile) */}
        <div style={{
          padding: '0.75rem 1.5rem 0.5rem',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE 10+ */
        }}>
          {PRESETS.map((p) => (
            <button key={p} className="btn-ghost" onClick={() => sendMessage(p)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 20, flexShrink: 0 }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            className="input-dark"
            placeholder="Tanya soal data channel, model ML, strategi konten, atau apapun yang nyambung..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={loading}
          />
          <button className="btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: '0.65rem 1.2rem', flexShrink: 0 }}>
            {loading ? <Loader size={16} /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
