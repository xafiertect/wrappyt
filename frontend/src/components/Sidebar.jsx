import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Video, Sparkles, Settings } from 'lucide-react';

export default function Sidebar({ theme, toggleTheme, onLogout }) {
  return (
    <>
      {/* Top Header Navbar */}
      <div className="nav-shell">
        <nav className="nav glass glow">
          <div className="brand">
            <div className="brand-logo">H</div>
            <div>
              <div className="brand-name">Hippo Academy</div>
              <div className="brand-sub">YouTube Analytics</div>
            </div>
          </div>
          
          <div className="nav-links">
            <a href="/" className="nlink">Home</a>
            <a href="/dashboard" className="nlink">Dashboard</a>
            <NavLink to="/analytics" className={({ isActive }) => `nlink ${isActive ? 'active' : ''}`}>Analitik Video</NavLink>
            <NavLink to="/consult" className={({ isActive }) => `nlink ${isActive ? 'active' : ''}`}>AI Consultant</NavLink>
            <NavLink to="/management" className={({ isActive }) => `nlink ${isActive ? 'active' : ''}`}>Management</NavLink>
          </div>

          <div className="nav-actions">
            <button className="icon-btn" id="theme-toggle" onClick={toggleTheme} aria-label="Ganti tema">
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>
                  <circle cx="12" cy="12" r="4.2"/>
                  <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 19, height: 19 }}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            
            {onLogout && (
              <button className="btn btn-danger" id="logout-btn" onClick={onLogout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                <span className="label-hide">Keluar</span>
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Floating Bottom Nav Dock (Mobile only) */}
      <div className="mobile-nav-shell">
        <a href="/" className="mobile-link">
          <Home size={20} />
          <span>Home</span>
        </a>
        <a href="/dashboard" className="mobile-link">
          <BarChart2 size={20} />
          <span>Dashboard</span>
        </a>
        <NavLink to="/analytics" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}>
          <Video size={20} />
          <span>Analitik</span>
        </NavLink>
        <NavLink to="/consult" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}>
          <Sparkles size={20} />
          <span>Consultant</span>
        </NavLink>
        <NavLink to="/management" className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}>
          <Settings size={20} />
          <span>Management</span>
        </NavLink>
      </div>
    </>
  );
}
