import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp, Bot, Brain, ShieldAlert, Sparkles, Youtube, BarChart3, Clock, CheckCircle, Sun, Moon, LogOut, Shield } from 'lucide-react';

export default function LandingPage({ theme, toggleTheme, isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
      
      {/* 🌐 stand-alone Header/Navbar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border-glass)',
        borderRadius: '16px',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: '1rem',
        zIndex: 100,
        transition: 'all 0.4s ease'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-cyan), #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: '800', color: '#FFF',
          }}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Hippo Academy</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>YouTube Analytics</div>
          </div>
        </div>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-badge)',
              border: '1px solid var(--border-glass)',
              borderRadius: '50%',
              color: 'var(--text-muted)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-cyan)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Navigation Action Buttons */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Link to="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                Dashboard
                <ArrowRight size={14} />
              </Link>
              <button 
                onClick={onLogout} 
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent-red)',
                  borderRadius: '10px',
                  color: 'var(--accent-red)',
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '0.8rem' }}>
              Masuk Aplikasi
            </Link>
          )}
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section style={{ 
        position: 'relative', 
        padding: '2rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.5rem',
        overflow: 'hidden'
      }}>
        {/* Background glowing ambient elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: -1,
          pointerEvents: 'none'
        }} className="pulse-glow" />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-badge)',
          border: '1px solid var(--border-glass)',
          borderRadius: '30px',
          padding: '5px 15px',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: 'var(--accent-cyan)'
        }}>
          <Sparkles size={13} className="animate-spin-slow" />
          <span>Solusi Berbasis Machine Learning &amp; AI</span>
        </div>

        <h1 style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: '3.5rem',
          fontWeight: 900,
          lineHeight: 1.1,
          maxWidth: '850px',
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginTop: '0.5rem'
        }}>
          Diagnosis &amp; Pulihkan Penurunan Views <span style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-cyan2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block'
          }}>YouTube Anda</span>
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          lineHeight: 1.7,
          fontFamily: "'Inter', sans-serif"
        }}>
          Gabungan XGBoost Regression, Prophet Forecasting, dan Gemini RAG Consultant untuk membantu kreator Hippo Academy mendeteksi anomali views serta menyusun strategi pemulihan terbaik secara real-time.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/dashboard" className="btn-primary" style={{ 
            fontSize: '1rem', 
            padding: '0.8rem 2rem', 
            borderRadius: '12px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            Masuk ke Aplikasi
            <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn-ghost" style={{ 
            fontSize: '1rem', 
            padding: '0.8rem 1.75rem', 
            borderRadius: '12px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            Pelajari Fitur
          </a>
        </div>
      </section>

      {/* 📊 Interactive Mockup Preview */}
      <section style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ 
          width: '100%', 
          maxWidth: '1000px', 
          padding: '1.5rem',
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-glass)',
          boxShadow: 'var(--shadow-premium), 0 20px 50px rgba(6,182,212,0.1)'
        }}>
          {/* Header Mockup */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>hippo-academy-analytics-v2.0</span>
            </div>
            <div className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
              ● LIVE PREVIEW MODEL ACTIVE
            </div>
          </div>

          {/* Grid Layout Mockup */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '1.5rem' }}>
                 {/* Kiri: Grafik */}
            <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-badge)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Proyeksi Views 30 Hari (Prophet Model)</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Menampilkan tren views jangka panjang beserta area tingkat kepercayaan (confidence interval)</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Proyeksi</span>
                </div>
              </div>

              {/* Grafik Garis Mockup */}
              <div style={{ height: '140px', position: 'relative', display: 'flex', alignItems: 'flex-end', justify: 'space-between', padding: '0 10px 10px 10px', borderBottom: '1px dashed var(--border-color)' }}>
                {/* Confidence interval band background */}
                <div style={{
                  position: 'absolute',
                  bottom: '25px',
                  left: 0,
                  right: 0,
                  height: '75px',
                  background: 'rgba(6,182,212,0.06)',
                  borderTop: '1px dashed rgba(6,182,212,0.2)',
                  borderBottom: '1px dashed rgba(6,182,212,0.2)',
                  zIndex: 0
                }} />
                {/* SVG path to draw a beautiful continuous gradient wave for projection */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradMock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M 0 65 Q 20 40 40 55 T 80 30 T 100 20 L 100 100 L 0 100 Z" fill="url(#gradMock)" />
                  <path d="M 0 65 Q 20 40 40 55 T 80 30 T 100 20" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" />
                </svg>
                
                {/* Mock data points overlay */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 8px var(--accent-cyan)' }} />
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: 4 }}>D-{15 - i*3}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanan: AI Insight Card */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel pulse-red" style={{ 
                padding: '1rem', 
                background: 'rgba(239,68,68,0.03)', 
                border: '1px solid rgba(239,68,68,0.25)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}>
                <ShieldAlert size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-red)' }}>Views Anomaly Detected!</div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
                    Isolation Forest mendeteksi penurunan penayangan non-normal sebesar 24% pada video terakhir Anda.
                  </p>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', background: 'var(--bg-badge)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Bot size={14} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rekomendasi Hippo AI:</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Rasio CTR Thumbnail Anda saat ini (3.2%) berada di bawah rata-rata channel (5.0%). Disarankan melakukan optimasi overlay teks kontras tinggi dengan warna kuning neon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧠 Core AI / ML Features Section */}
      <section id="features" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800 }}>Pondasi Algoritma Cerdas Kami</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: 6 }}>
            Empat pilar kecerdasan buatan untuk mengawal performa dan pertumbuhan channel YouTube Anda.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '1.5rem' 
        }}>
          
          {/* Card 1: XGBoost */}
          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-cyan)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Brain size={20} color="var(--accent-cyan)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>XGBoost Regression</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Model regresi yang dilatih khusus dengan 29 metrik utama (CTR, retensi, impresi, dsb.) untuk memproyeksikan penayangan jangka pendek secara akurat.
            </p>
          </div>

          {/* Card 2: Prophet Forecasting */}
          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-green)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <TrendingUp size={20} color="var(--accent-green)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Prophet Time-Series</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Memetakan tren musiman, mingguan, hingga harian guna meramalkan performa views channel hingga 30 hari ke depan secara kontinu.
            </p>
          </div>

          {/* Card 3: Isolation Forest */}
          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-red)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <ShieldAlert size={20} color="var(--accent-red)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Anomaly Detection</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Algoritma Isolation Forest mendeteksi secara proaktif jika ada pola penurunan penayangan di luar batas wajar untuk mencegah kehilangan jangkauan audiens.
            </p>
          </div>

          {/* Card 4: Gemini RAG */}
          <div className="metric-card" style={{ borderTop: '2px solid var(--accent-gold)' }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Bot size={20} color="var(--accent-gold)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>AI Consultation</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Konsultan AI pribadi berbasis Google Gemini yang di-bound secara RAG ke basis pengetahuan internal kurikulum Hippo Academy untuk strategi pengembangan konten teruji.
            </p>
          </div>

        </div>
      </section>

      {/* 📈 YouTube Real-Time Sync & Optimization */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', alignItems: 'center' }}>
        <div>
          <div className="badge badge-cyan" style={{ marginBottom: 12 }}>INTEGRASI RESMI YOUTUBE API</div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Sinkronisasi Data Otomatis &amp; Asisten Penjadwalan Konten
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, marginTop: '0.8rem' }}>
            Hubungkan akun Google YouTube Anda secara aman lewat OAuth 2.0 untuk menyedot metrik video terbaru secara real-time. Anda juga dapat menggunakan draf pengelola konten (Kanban) dan asisten thumbnail yang terintegrasi langsung di satu dasbor terpadu.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
            {[
              'Otorisasi OAuth 2.0 yang sangat aman untuk melacak video terbaru',
              'Optimal post hours scheduler untuk mencari jam tayang berdaya saing tinggi',
              'Saran CTR Thumbnail Generator yang disesuaikan secara visual'
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <CheckCircle size={15} color="var(--accent-green)" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mock Kanban / Scheduler UI */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Rekomendasi Jam Posting Terbaik</span>
            </div>
            <span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>SKALA EFEKTIVITAS</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { day: 'Jumat', time: '17:00 WIB', reason: 'Awal akhir pekan, waktu santai penonton naik tajam', score: 95 },
              { day: 'Sabtu', time: '13:00 WIB', reason: 'Jam istirahat siang di akhir pekan, engagement optimal', score: 88 }
            ].map((slot, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-badge)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{slot.day} • {slot.time}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{slot.reason}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'var(--accent-gold)' }}>
                  <span>{slot.score}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 Call to Action Bottom */}
      <section style={{ 
        background: 'linear-gradient(135deg, rgba(6,182,212,0.07) 0%, rgba(16,185,129,0.02) 100%)',
        border: '1px solid var(--border-glass)',
        borderRadius: '24px',
        padding: '3.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: 'var(--shadow-premium)'
      }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Siap Meningkatkan Performa Channel Anda?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '550px', lineHeight: 1.6 }}>
          Mulai analisis metrik video, prediksi views masa depan, dapatkan alert deteksi anomali dini, dan konsultasikan strategi konten Anda sekarang secara gratis.
        </p>
        <Link to="/dashboard" className="btn-primary" style={{ 
          marginTop: '1rem', 
          fontSize: '0.95rem', 
          padding: '0.75rem 2rem', 
          borderRadius: '12px', 
          textDecoration: 'none' 
        }}>
          Mulai Diagnosis Sekarang
          <ArrowRight size={16} />
        </Link>
      </section>

    </div>
  );
}
