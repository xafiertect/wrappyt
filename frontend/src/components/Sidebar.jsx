import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart2, MessageSquare, Layers } from 'lucide-react';

const navItems = [
  { to: '/',           label: 'Dashboard',     icon: LayoutDashboard },
  { to: '/analytics',  label: 'Analitik Video', icon: BarChart2 },
  { to: '/consult',    label: 'AI Consultant',  icon: MessageSquare },
  { to: '/management', label: 'Management',     icon: Layers },
];

export default function Sidebar() {
  return (
    <aside style={{
      width: '240px',
      minHeight: '100vh',
      background: 'rgba(15,23,42,0.95)',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      position: 'sticky',
      top: 0,
      backdropFilter: 'blur(16px)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '2.5rem', padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: '800', color: '#000',
          }}>H</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#F8FAFC' }}>Hippo Academy</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B' }}>YouTube Analytics</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
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
              fontWeight: isActive ? 600 : 400,
              fontSize: '0.875rem',
              color: isActive ? '#06B6D4' : '#94A3B8',
              background: isActive ? 'rgba(6,182,212,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            })}
            onMouseEnter={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = '#CBD5E1'; }}
            onMouseLeave={e => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.color = '#94A3B8'; }}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '1rem' }}>
        <div style={{ fontSize: '0.7rem', color: '#475569', textAlign: 'center', lineHeight: 1.6 }}>
          Backend: <span style={{ color: '#06B6D4' }}>localhost:8000</span><br />
          Model: XGBoost + Prophet
        </div>
      </div>
    </aside>
  );
}
