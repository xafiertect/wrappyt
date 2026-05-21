import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import Analytics    from './pages/Analytics';
import Consultation from './pages/Consultation';
import Management  from './pages/Management';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          minWidth: 0,
          background: 'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.04) 0%, transparent 60%), var(--bg-dark)',
        }}>
          <Routes>
            <Route path="/"           element={<Dashboard />} />
            <Route path="/analytics"  element={<Analytics />} />
            <Route path="/consult"    element={<Consultation />} />
            <Route path="/management" element={<Management />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
