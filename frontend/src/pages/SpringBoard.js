import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getTeamReport, getProjectReport } from '../services/api';
import dashboardHero from '../assets/dashboard_hero.jpg';

function SpringBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalUsers: 0,
    totalProjects: 0,
    done: 0,
    inProgress: 0,
    todo: 0,
  });

  useEffect(() => {
    Promise.all([getTeamReport(), getProjectReport()])
      .then(([t, p]) => setStats({ ...t.data, ...p.data }))
      .catch(() => {});
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = [
    {
      label: 'Active Projects',
      value: stats.totalProjects || 0,
      trend: '+2 new',
      color: '#0284c7',
      bg: '#f0f9ff',
      path: '/projects',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
      ),
    },
    {
      label: 'Completed Tasks',
      value: stats.done || 0,
      trend: '100% verified',
      color: '#16a34a',
      bg: '#f0fdf4',
      path: '/dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
    {
      label: 'In Progress',
      value: stats.inProgress || 0,
      trend: 'Active sprint',
      color: '#d97706',
      bg: '#fffbeb',
      path: '/dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
    },
    {
      label: 'Teams & Squads',
      value: stats.totalTeams || 0,
      trend: 'Collaborating',
      color: '#4f46e5',
      bg: '#eef2ff',
      path: '/teams',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
  ];

  const quickLinks = [
    {
      label: 'Sprint Board',
      path: '/dashboard',
      desc: 'Interactive Kanban board & your assigned tasks',
      gradient: '#f0f9ff',
      border: '#bae6fd',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
        </svg>
      ),
    },
    {
      label: 'Project Explorer',
      path: '/projects',
      desc: 'Manage milestones, deliverables, and team backlogs',
      gradient: '#eef2ff',
      border: '#c7d2fe',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
      ),
    },
    {
      label: 'Analytics & Reports',
      path: '/reports',
      desc: 'Performance metrics, sprint velocity, and burn-down',
      gradient: '#f0fdf4',
      border: '#bbf7d0',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    ...(role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER'
      ? [
          {
            label: 'Team Management',
            path: '/teams',
            desc: 'Organize project groups, squads, and member allocations',
            gradient: '#fffbeb',
            border: '#fde68a',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ),
          },
        ]
      : []),
    ...(role === 'ROLE_ADMIN'
      ? [
          {
            label: 'Security & Admin',
            path: '/admin',
            desc: 'Control user permissions, role elevation, and auditing',
            gradient: '#fff1f2',
            border: '#fecdd3',
            icon: (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Hero Welcome Banner with Graphic */}
      <div
        className="card"
        style={{
          marginBottom: 32,
          border: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '45%',
            backgroundImage: `url(${dashboardHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 100%)',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
        />

        <div className="card-body" style={{ padding: '36px 40px', position: 'relative', zIndex: 2, maxWidth: 680 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #bae6fd', color: '#0284c7', fontSize: '0.8rem', fontWeight: 700, marginBottom: 16 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
            Sprint Cycle Live
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {getGreeting()}, {user?.username} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: '1.02rem', lineHeight: 1.6 }}>
            Your workspace is active. You have sprint goals and project tasks queued for this week.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 24, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Sprint Board →
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
              View All Projects
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="stats-grid">
        {cards.map((c) => (
          <div
            key={c.label}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(c.path)}
          >
            <div className="stat-icon-wrapper">
              <div className="stat-icon" style={{ background: c.bg, color: c.color }}>
                {c.icon}
              </div>
              <span className="stat-trend" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                {c.trend}
              </span>
            </div>
            <div className="stat-value" style={{ color: c.color }}>
              {c.value}
            </div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Access Launchpad */}
      <div style={{ marginTop: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Quick Actions & Workspaces</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: 2 }}>
              Fast jump to modules, boards, and administration
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
          {quickLinks.map((l) => (
            <div
              key={l.path}
              className="card card-interactive"
              style={{
                cursor: 'pointer',
              }}
              onClick={() => navigate(l.path)}
            >
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: l.gradient,
                    border: `1px solid ${l.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {l.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)' }}>{l.label}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.45 }}>
                    {l.desc}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SpringBoard;
