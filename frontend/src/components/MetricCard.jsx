export default function MetricCard({ icon: Icon, label, value, unit = '', color = '#06B6D4', loading = false, sub }) {
  if (loading) {
    return (
      <div className="metric-card" style={{ minHeight: 120 }}>
        <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 32, width: '70%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '50%' }} />
      </div>
    );
  }

  return (
    <div className="metric-card" style={{ borderTop: `2px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: 34, height: 34, borderRadius: '9px',
            background: `${color}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={color} />
          </div>
        )}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F8FAFC', lineHeight: 1.1, marginBottom: '0.4rem' }}>
        {value ?? '—'}
        {unit && <span style={{ fontSize: '1rem', color: '#64748B', marginLeft: 4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{sub}</div>}
    </div>
  );
}
