import { useEffect, useState } from 'react';
import { getUsers, deleteUser, updateUserRole } from '../services/api';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const load = () => {
    setLoading(true);
    getUsers()
      .then((r) => setUsers(r.data))
      .catch(() => showAlert('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Are you sure you want to remove user "${username}"?`)) return;
    try {
      await deleteUser(id);
      showAlert(`User "${username}" deleted successfully.`);
      load();
    } catch {
      showAlert('Failed to delete user', 'error');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      showAlert('User role updated successfully.');
      load();
    } catch {
      showAlert('Failed to update role', 'error');
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeClass = (role) => {
    if (role === 'ROLE_ADMIN') return 'badge badge-admin';
    if (role === 'ROLE_MANAGER') return 'badge badge-manager';
    return 'badge badge-member';
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin & User Governance</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
            Manage access controls, assign team roles, and supervise active accounts across TaskTide.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={load} title="Refresh User List">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {alert.type === 'error' ? (
              <>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </>
            ) : (
              <>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </>
            )}
          </svg>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid">
        {[
          {
            label: 'Total Registered',
            value: users.length,
            color: '#0284c7',
            bg: '#f0f9ff',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            ),
          },
          {
            label: 'Administrators',
            value: users.filter((u) => u.role === 'ROLE_ADMIN').length,
            color: '#4f46e5',
            bg: '#eef2ff',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            ),
          },
          {
            label: 'Project Managers',
            value: users.filter((u) => u.role === 'ROLE_MANAGER').length,
            color: '#0284c7',
            bg: '#f0f9ff',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              </svg>
            ),
          },
          {
            label: 'Team Members',
            value: users.filter((u) => u.role === 'ROLE_MEMBER').length,
            color: '#16a34a',
            bg: '#f0fdf4',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            ),
          },
        ].map((s) => (
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

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div>
            <h3>All Workspace Users</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {users.length} registered accounts
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <svg
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none',
                }}
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="form-control"
                style={{ paddingLeft: 36, width: 220, fontSize: '0.85rem' }}
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: 150, fontSize: '0.85rem' }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_MANAGER">Manager</option>
              <option value="ROLE_MEMBER">Member</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Contact Email</th>
                  <th>Role Level</th>
                  <th>Permissions</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: '0.82rem' }}>
                          {u.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>
                            {u.username}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {u.fullName || 'No display name'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-body)', fontSize: '0.88rem' }}>
                      {u.email}
                    </td>
                    <td>
                      <span className={getRoleBadgeClass(u.role)}>
                        <span className="badge-dot" />
                        {u.role === 'ROLE_ADMIN' ? 'Admin' : u.role === 'ROLE_MANAGER' ? 'Manager' : 'Member'}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: 140, fontSize: '0.82rem', padding: '6px 10px' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="ROLE_MEMBER">Member</option>
                        <option value="ROLE_MANAGER">Manager</option>
                        <option value="ROLE_ADMIN">Admin</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u.id, u.username)}
                        title="Delete User"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>No matching users found</div>
                      <div style={{ fontSize: '0.85rem', marginTop: 4 }}>Try clearing search keywords or role filters.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
