import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, MessageSquare, Layers, Home, Sun, Moon, LogOut } from 'lucide-react';

const navItems = [
  { to: '/',           label: 'Home',          icon: Home },
  { to: '/dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/analytics',  label: 'Analitik Video', icon: BarChart2 },
  { to: '/consult',    label: 'AI Consultant',  icon: MessageSquare },
  { to: '/management', label: 'Management',     icon: Layers },
];

export default function Sidebar({ theme, toggleTheme, onLogout }) {
  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      backdropFilter: 'blur(16px)',
      flexShrink: 0,
      transition: 'background-color 0.4s ease, border-color 0.4s ease',
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--accent-cyan), #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: '800', color: '#FFF',
          }}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', transition: 'color 0.4s' }}>Hippo Academy</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', transition: 'color 0.4s' }}>YouTube Analytics</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0.7rem 0.85rem',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 500,
              fontSize: '0.875rem',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
              background: isActive ? 'rgba(6,182,212,0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(6,182,212,0.18)' : '1px solid transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--accent-cyan)'; }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle Switch */}
      <div style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.6rem 0.85rem',
            background: 'var(--bg-badge)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 500,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            width: '100%',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)'; e.currentTarget.style.color = 'var(--accent-cyan)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div style={{
            width: '32px',
            height: '18px',
            borderRadius: '20px',
            background: theme === 'dark' ? 'rgba(6,182,212,0.3)' : 'rgba(100,116,139,0.2)',
            position: 'relative',
            padding: '2px',
            transition: 'background 0.3s'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: theme === 'dark' ? 'var(--accent-cyan)' : '#64748B',
              position: 'absolute',
              top: '2px',
              left: theme === 'dark' ? '16px' : '2px',
              transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </button>
      </div>

      {/* Logout Button */}
      {onLogout && (
        <div style={{ padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          <button 
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.6rem 0.85rem',
              background: 'transparent',
              border: '1px solid var(--accent-red)',
              borderRadius: '10px',
              color: 'var(--accent-red)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={15} />
            <span>Keluar Sesi</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', transition: 'border-color 0.4s' }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6, transition: 'color 0.4s' }}>
          Backend: <span style={{ color: 'var(--accent-cyan)' }}>localhost:8000</span><br />
          Model: XGBoost + Prophet
        </div>
      </div>
    </aside>
  );
}
