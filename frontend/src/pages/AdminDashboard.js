import { useEffect, useState, useCallback } from 'react';
import { getUsers, deleteUser, updateUserRole, getAuditLogs } from '../services/api';
import useAuth from '../hooks/useAuth';

function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const currentRole = currentUser?.roles?.[0];
  const isAdmin = currentRole === 'ROLE_ADMIN';

  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'

  // Users state
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditSearch, setAuditSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      getUsers().then((r) => r.data).catch(() => []),
      getAuditLogs().then((r) => r.data).catch(() => []),
    ])
      .then(([userData, auditData]) => {
        setUsers(userData);
        setAuditLogs(auditData);
      })
      .catch(() => showAlert('Failed to load governance data', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleDelete = async (id, username, targetRole) => {
    // Only Admin can delete Admins and Project Managers
    if (!isAdmin) {
      showAlert('Permission denied: Only Administrators can remove users.', 'error');
      return;
    }

    if (currentUser?.username === username) {
      showAlert('Cannot remove your own active administrative account.', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user "${username}" (${targetRole})?`)) return;

    try {
      await deleteUser(id);
      showAlert(`User "${username}" deleted successfully.`);
      loadAll();
    } catch {
      showAlert('Failed to delete user.', 'error');
    }
  };

  const handleRoleChange = async (id, newRole, targetUsername) => {
    if (!isAdmin) {
      showAlert('Permission denied: Only Administrators can modify roles.', 'error');
      return;
    }

    try {
      await updateUserRole(id, newRole);
      showAlert(`Updated role for ${targetUsername} to ${newRole.replace('ROLE_', '')}.`);
      loadAll();
    } catch {
      showAlert('Failed to update user role.', 'error');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const filteredLogs = auditLogs.filter((l) =>
    l.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.performedBy?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.details?.toLowerCase().includes(auditSearch.toLowerCase()) ||
    l.targetEntity?.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    if (role === 'ROLE_ADMIN') return 'badge badge-admin';
    if (role === 'ROLE_MANAGER') return 'badge badge-manager';
    return 'badge badge-member';
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('APPROVE')) return 'badge badge-approved';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'badge badge-rejected';
    if (action.includes('SUBMIT')) return 'badge badge-submitted';
    if (action.includes('CREATE') || action.includes('ADD')) return 'badge badge-inprogress';
    return 'badge badge-todo';
  };

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin & Governance Console</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
            Manage access controls, assign team roles, and supervise system audit trails across TaskTide.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={loadAll} title="Refresh Data">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Refresh
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`}>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
        <button
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Governance ({users.length})
        </button>
        <button
          className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('audit')}
        >
          📜 Security & Audit Trails ({auditLogs.length})
        </button>
      </div>

      {/* TAB 1: User Governance */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Filter Bar */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by username, full name, or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: 'auto', minWidth: 180 }}
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="ROLE_ADMIN">Administrator</option>
                <option value="ROLE_MANAGER">Project Manager</option>
                <option value="ROLE_MEMBER">Team Member</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 18px' }}>User</th>
                    <th style={{ padding: '12px 18px' }}>Email</th>
                    <th style={{ padding: '12px 18px' }}>Current Role</th>
                    <th style={{ padding: '12px 18px' }}>Change Role</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        No users found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = currentUser?.username === u.username;
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>
                                {u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <strong>{u.fullName || u.username}</strong>
                                {isSelf && <span style={{ fontSize: '0.72rem', marginLeft: 6, background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 4 }}>You</span>}
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ padding: '14px 18px' }}>
                            <span className={getRoleBadgeClass(u.role)}>
                              {u.role === 'ROLE_ADMIN' ? 'Administrator' : u.role === 'ROLE_MANAGER' ? 'Project Manager' : 'Team Member'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <select
                              className="form-control"
                              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.82rem' }}
                              value={u.role}
                              disabled={isSelf || !isAdmin}
                              onChange={(e) => handleRoleChange(u.id, e.target.value, u.username)}
                            >
                              <option value="ROLE_ADMIN">Administrator</option>
                              <option value="ROLE_MANAGER">Project Manager</option>
                              <option value="ROLE_MEMBER">Team Member</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              className="btn-icon"
                              disabled={isSelf || !isAdmin}
                              onClick={() => handleDelete(u.id, u.username, u.role)}
                              title={isSelf ? 'Cannot delete yourself' : 'Remove User'}
                              style={{ color: isSelf || !isAdmin ? 'var(--text-dim)' : 'var(--danger)' }}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
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
      )}

      {/* TAB 2: System Audit Logs */}
      {activeTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ padding: 16 }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search audit trail by user, action, target, or details..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Timestamp</th>
                    <th style={{ padding: '12px 16px' }}>Action</th>
                    <th style={{ padding: '12px 16px' }}>Performed By</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Target</th>
                    <th style={{ padding: '12px 16px' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={getActionBadgeClass(log.action)}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {log.performedBy}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: '0.78rem', background: 'var(--bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>
                            {log.userRole || 'USER'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {log.targetEntity} {log.targetId ? `#${log.targetId}` : ''}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
