import { useEffect, useState } from 'react';
import { getTeamReport, getProjectReport, getPerformanceReport } from '../services/api';

function Report() {
  const [teamData, setTeamData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getTeamReport(), getProjectReport(), getPerformanceReport()])
      .then(([t, p, perf]) => {
        setTeamData(t.data);
        setProjectData(p.data);
        setPerformance(perf.data);
      })
      .catch(() => setError('Failed to load performance telemetry.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  const totalTasks =
    (projectData?.done || 0) + (projectData?.inProgress || 0) + (projectData?.todo || 0);
  const pct = (v) => (totalTasks > 0 ? Math.round((v / totalTasks) * 100) : 0);

  const stats = [
    {
      label: 'Total Projects',
      value: projectData?.totalProjects || 0,
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 8 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
        </svg>
      ),
    },
    {
      label: 'Active Teams',
      value: teamData?.totalTeams || 0,
      color: '#4f46e5',
      bg: '#eef2ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      label: 'Total Members',
      value: teamData?.totalUsers || 0,
      color: '#0284c7',
      bg: '#f0f9ff',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
    },
    {
      label: 'Tasks Delivered',
      value: projectData?.done || 0,
      color: '#16a34a',
      bg: '#f0fdf4',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1350, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Analytics & Sprint Telemetry</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
          Real-time delivery velocity, pipeline breakdown, and individual member contribution metrics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon-wrapper">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
            </div>
            <div className="stat-value" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 24 }}>
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Delivery Pipeline Status
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {totalTasks} Total Tasks Recorded
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { label: 'Completed (Done)', value: projectData?.done || 0, color: '#16a34a', glow: 'rgba(22, 163, 74, 0.2)' },
              { label: 'Active (In Progress)', value: projectData?.inProgress || 0, color: '#0284c7', glow: 'rgba(2, 132, 199, 0.2)' },
              { label: 'Queued (To Do)', value: projectData?.todo || 0, color: '#64748b', glow: 'rgba(100, 116, 139, 0.2)' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.88rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong>{item.value}</strong> ({pct(item.value)}%)
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: 'var(--bg-subtle)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct(item.value)}%`,
                      background: item.color,
                      borderRadius: 999,
                      boxShadow: `0 0 8px ${item.glow}`,
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workspace Health Overview */}
        <div className="card">
          <div className="card-header">
            <h3>Workspace Summary</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: 'calc(100% - 60px)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius)',
                  padding: '24px 18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#0284c7', lineHeight: 1 }}>
                  {teamData?.totalTeams || 0}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>
                  Active Squads
                </div>
              </div>

              <div
                style={{
                  background: '#eef2ff',
                  border: '1px solid #c7d2fe',
                  borderRadius: 'var(--radius)',
                  padding: '24px 18px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#4f46e5', lineHeight: 1 }}>
                  {teamData?.totalUsers || 0}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: 8 }}>
                  Team Members
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ fontSize: '1.4rem' }}>🚀</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Sprint velocity is calculated based on completed deliverable units over active cycles.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Performance Table */}
      <div className="card">
        <div className="card-header">
          <h3>Member Performance & Output</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Completed tasks vs total assigned
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Assigned Tasks</th>
                <th>Completed</th>
                <th>Delivery Rate</th>
              </tr>
            </thead>
            <tbody>
              {performance.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px 20px' }}>
                    No member delivery records found yet.
                  </td>
                </tr>
              ) : (
                performance.map((p) => {
                  const pctDone =
                    p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
                  return (
                    <tr key={p.userId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                            {p.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                            {p.username}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{p.totalTasks}</td>
                      <td style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: 600 }}>
                        {p.completedTasks}
                      </td>
                      <td style={{ minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              background: 'var(--bg-subtle)',
                              borderRadius: 999,
                              overflow: 'hidden',
                              border: '1px solid var(--border)',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pctDone}%`,
                                background:
                                  pctDone === 100
                                    ? '#16a34a'
                                    : pctDone >= 50
                                    ? '#0284c7'
                                    : '#d97706',
                                borderRadius: 999,
                                transition: 'width 0.6s ease',
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              color: pctDone === 100 ? '#16a34a' : 'var(--text)',
                              width: 42,
                            }}
                          >
                            {pctDone}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Report;
