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
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error) return <div className="alert alert-error" role="alert">{error}</div>;

  const total = (projectData?.done || 0) + (projectData?.inProgress || 0) + (projectData?.todo || 0);
  const pct = (v) => total > 0 ? Math.round((v / total) * 100) : 0;

  return (
    <div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Projects', value: projectData?.totalProjects || 0, color: '#4f46e5' },
          { label: 'Total Teams', value: teamData?.totalTeams || 0, color: '#06b6d4' },
          { label: 'Total Users', value: teamData?.totalUsers || 0, color: '#7c3aed' },
          { label: 'Tasks Done', value: projectData?.done || 0, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><h3>Task Status Breakdown</h3></div>
          <div className="card-body">
            {[
              { label: 'Done', value: projectData?.done || 0, color: '#10b981', bg: '#d1fae5' },
              { label: 'In Progress', value: projectData?.inProgress || 0, color: '#f59e0b', bg: '#fef3c7' },
              { label: 'To Do', value: projectData?.todo || 0, color: '#64748b', bg: '#f1f5f9' },
            ].map(item => (
              <div key={item.label} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{item.value} ({pct(item.value)}%)</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct(item.value)}%`, background: item.color, borderRadius: 4, transition: 'width .5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3>Team Overview</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Teams', value: teamData?.totalTeams || 0, color: '#06b6d4', bg: '#cffafe' },
                { label: 'Users', value: teamData?.totalUsers || 0, color: '#7c3aed', bg: '#ede9fe' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '20px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '.8rem', color: s.color, fontWeight: 500, marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>User Performance</h3></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>User</th><th>Total Tasks</th><th>Completed</th><th>Progress</th></tr>
            </thead>
            <tbody>
              {performance.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No data available.</td></tr>
              ) : performance.map(p => {
                const pctDone = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
                return (
                  <tr key={p.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: '.7rem' }}>{p.username?.slice(0,2).toUpperCase()}</div>
                        <span style={{ fontWeight: 500, fontSize: '.875rem' }}>{p.username}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '.875rem' }}>{p.totalTasks}</td>
                    <td style={{ fontSize: '.875rem' }}>{p.completedTasks}</td>
                    <td style={{ minWidth: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pctDone}%`, background: pctDone === 100 ? '#10b981' : '#4f46e5', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)', width: 32 }}>{pctDone}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Report;
