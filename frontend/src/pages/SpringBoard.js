import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getTeamReport, getProjectReport } from '../services/api';

function SpringBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const [stats, setStats] = useState({ totalTeams: 0, totalUsers: 0, totalProjects: 0, done: 0, inProgress: 0, todo: 0 });

  useEffect(() => {
    Promise.all([getTeamReport(), getProjectReport()])
      .then(([t, p]) => setStats({ ...t.data, ...p.data }))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Projects', value: stats.totalProjects, color: '#4f46e5', bg: '#e0e7ff', path: '/projects' },
    { label: 'Tasks Done', value: stats.done, color: '#10b981', bg: '#d1fae5', path: '/dashboard' },
    { label: 'In Progress', value: stats.inProgress, color: '#f59e0b', bg: '#fef3c7', path: '/dashboard' },
    { label: 'Total Teams', value: stats.totalTeams, color: '#06b6d4', bg: '#cffafe', path: '/teams' },
  ];

  const quickLinks = [
    { label: 'My Tasks', icon: '✓', path: '/dashboard', desc: 'View your assigned tasks' },
    { label: 'Projects', icon: '◈', path: '/projects', desc: 'Browse all projects' },
    { label: 'Reports', icon: '▦', path: '/reports', desc: 'Analytics & performance' },
    ...(role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER' ? [{ label: 'Teams', icon: '◉', path: '/teams', desc: 'Manage teams & members' }] : []),
    ...(role === 'ROLE_ADMIN' ? [{ label: 'Admin', icon: '⚙', path: '/admin', desc: 'User management' }] : []),
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Welcome back, {user?.username} 👋</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Here's what's happening in your workspace.</p>
      </div>

      <div className="stats-grid">
        {cards.map(c => (
          <div key={c.label} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate(c.path)}>
            <div className="stat-icon" style={{ background: c.bg, color: c.color, fontSize: '1.2rem' }}>◈</div>
            <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Quick Access</h3>
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {quickLinks.map(l => (
          <div key={l.path} className="card" style={{ cursor: 'pointer', transition: 'box-shadow .15s' }}
            onClick={() => navigate(l.path)}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{l.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{l.label}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SpringBoard;
