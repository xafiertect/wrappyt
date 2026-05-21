import { useState, useRef, useEffect } from 'react';
import { chatConsultation } from '../services/api';
import { Send, Loader, Bot, User, ShieldAlert } from 'lucide-react';

const PRESETS = [
  'Bagaimana cara menaikkan CTR thumbnail?',
  'Strategi hook 10 detik pertama yang efektif',
  'Mengapa retensi video saya rendah?',
  'Jam terbaik upload konten edukatif',
  'Cara riset topik viral YouTube',
];

const OFF_TOPIC_KEYWORDS = ['saham', 'crypto', 'resep', 'cuaca', 'berita', 'politik', 'olahraga', 'game'];

function isOffTopic(msg) {
  return OFF_TOPIC_KEYWORDS.some(kw => msg.toLowerCase().includes(kw));
}

export default function Consultation() {
  const [messages,  setMessages]  = useState([
    { role: 'ai', text: 'Halo! Saya Hippo Assistant 🦛 — AI konsultan YouTube dari Hippo Academy. Tanyakan apa saja seputar strategi konten, CTR, retensi, atau analitik channel Anda!' }
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

    // Off-topic guardrail (client-side)
    if (isOffTopic(msg)) {
      setMessages(prev => [...prev,
        { role: 'user', text: msg },
        { role: 'system-warn', text: 'Pertanyaan di luar topik dibatasi oleh sistem. Silakan tanyakan seputar YouTube, strategi konten, atau analitik channel.' },
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
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', gap: '1rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>AI Consultant</h1>
        <p style={{ color: '#64748B', fontSize: '0.875rem' }}>Hippo Academy Assistant — RAG powered by Gemini</p>
      </div>

      {/* Chat Area */}
      <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg, i) => {
            if (msg.role === 'system-warn') return (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 12, padding: '0.75rem 1rem',
              }}>
                <ShieldAlert size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.85rem', color: '#FCA5A5' }}>{msg.text}</span>
              </div>
            );

            if (msg.role === 'error') return (
              <div key={i} style={{ fontSize: '0.82rem', color: '#EF4444', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 8 }}>
                {msg.text}
              </div>
            );

            const isUser = msg.role === 'user';
            return (
              <div key={i} style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isUser ? 'rgba(6,182,212,0.2)' : 'rgba(30,41,59,0.8)',
                  border: `1px solid ${isUser ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isUser ? <User size={15} color="#06B6D4" /> : <Bot size={15} color="#94A3B8" />}
                </div>
                {/* Bubble */}
                <div style={{
                  maxWidth: '72%',
                  background: isUser ? 'rgba(6,182,212,0.12)' : 'rgba(30,41,59,0.7)',
                  border: `1px solid ${isUser ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  lineHeight: 1.65,
                  color: '#E2E8F0',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={15} color="#94A3B8" />
              </div>
              <div style={{ display: 'flex', gap: 5, padding: '0.6rem 1rem', background: 'rgba(30,41,59,0.7)', borderRadius: '4px 16px 16px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                {[0,1,2].map(j => (
                  <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#06B6D4', animation: `bounce 1.2s ${j * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Preset Chips */}
        <div style={{ padding: '0.75rem 1.5rem 0', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PRESETS.map((p) => (
            <button key={p} className="btn-ghost" onClick={() => sendMessage(p)}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 20 }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input
            className="input-dark"
            placeholder="Ketik pertanyaan seputar YouTube atau Hippo Academy..."
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
