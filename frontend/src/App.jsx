import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LandingPage  from './pages/LandingPage';
import LoginPage    from './pages/LoginPage';
import Dashboard    from './pages/Dashboard';
import Analytics    from './pages/Analytics';
import Consultation from './pages/Consultation';
import Management  from './pages/Management';

// Protected Route Wrapper
function ProtectedRoute({ isAuthenticated, children }) {
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hippo-theme') || 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('hippo-auth') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hippo-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('hippo-auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('hippo-auth', 'false');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public standalone Landing Page (Tanpa Sidebar) */}
        <Route path="/" element={
          <div style={{ 
            minHeight: '100vh', 
            background: 'var(--bg-gradient-main)',
            transition: 'background-color 0.4s ease',
            padding: '1.5rem 2.5rem'
          }}>
            <LandingPage theme={theme} toggleTheme={toggleTheme} isAuthenticated={isAuthenticated} onLogout={handleLogout} />
          </div>
        } />

        {/* Public standalone Login Page (Tanpa Sidebar) */}
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage theme={theme} toggleTheme={toggleTheme} onLogin={handleLogin} />
          )
        } />

        {/* Protected Dashboard/App Pages (Dengan Sidebar Layout) */}
        <Route path="/*" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)', transition: 'background-color 0.4s ease' }}>
              <Sidebar theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />
              <main style={{
                flex: 1,
                padding: '2.5rem',
                overflowY: 'auto',
                minWidth: 0,
                background: 'var(--bg-gradient-main)',
                transition: 'background-color 0.4s ease',
              }}>
                <Routes>
                  <Route path="/dashboard"  element={<Dashboard />} />
                  <Route path="/analytics"  element={<Analytics />} />
                  <Route path="/consult"    element={<Consultation />} />
                  <Route path="/management" element={<Management />} />
                  {/* Redirect unmatched protected paths to dashboard */}
                  <Route path="*"           element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

