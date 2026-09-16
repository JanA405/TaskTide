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
    setTimeout(() => setAlert(null), 3000);
  };

  const load = () => {
    setLoading(true);
    getUsers()
      .then(r => setUsers(r.data))
      .catch(() => showAlert('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      showAlert('User deleted successfully.');
      load();
    } catch {
      showAlert('Failed to delete user', 'error');
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await updateUserRole(id, role);
      showAlert('Role updated successfully.');
      load();
    } catch {
      showAlert('Failed to update role', 'error');
    }
  };

  const filtered = users.filter(u => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          {alert.msg}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Users', value: users.length, color: '#4f46e5' },
          { label: 'Admins', value: users.filter(u => u.role === 'ROLE_ADMIN').length, color: '#7c3aed' },
          { label: 'Managers', value: users.filter(u => u.role === 'ROLE_MANAGER').length, color: '#0891b2' },
          { label: 'Members', value: users.filter(u => u.role === 'ROLE_MEMBER').length, color: '#059669' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3>User Management</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="form-control"
                style={{ paddingLeft: 28, width: 200, fontSize: '.8rem' }}
                placeholder="Search users..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-control"
              style={{ width: 130, fontSize: '.8rem' }}
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="ROLE_ADMIN">Admin</option>
              <option value="ROLE_MANAGER">Manager</option>
              <option value="ROLE_MEMBER">Member</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '.75rem' }}>
                          {u.username?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{u.username}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{u.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '.875rem', color: 'var(--text-muted)' }}>{u.email}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ width: 130, fontSize: '.8rem', padding: '5px 8px' }}
                        value={u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                      >
                        <option value="ROLE_MEMBER">Member</option>
                        <option value="ROLE_MANAGER">Manager</option>
                        <option value="ROLE_ADMIN">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                      No users found.
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
