import { useEffect, useState } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, getUsers, updateUserRole, deleteUser } from '../services/api';
import useAuth from '../hooks/useAuth';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TeamManagement() {
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const isAdmin = role === 'ROLE_ADMIN';

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '' });

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const loadTeams = () =>
    getTeams().then(r => setTeams(r.data)).catch(() => showAlert('Failed to load teams', 'error'));

  const loadUsers = () => {
    // /api/users requires ROLE_ADMIN
    if (!isAdmin) return;
    getUsers().then(r => setUsers(r.data)).catch(() => {});
  };

  useEffect(() => {
    loadTeams();
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTeam(null);
    setTeamForm({ name: '', description: '' });
    setShowTeamForm(true);
  };

  const openEdit = (t) => {
    setEditTeam(t);
    setTeamForm({ name: t.name, description: t.description || '' });
    setShowTeamForm(true);
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTeam) {
        await updateTeam(editTeam.id, teamForm);
        showAlert('Team updated successfully.');
      } else {
        await createTeam(teamForm);
        showAlert('Team created successfully.');
      }
      setShowTeamForm(false);
      loadTeams();
    } catch {
      showAlert('Failed to save team', 'error');
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await deleteTeam(id);
      showAlert('Team deleted successfully.');
      loadTeams();
    } catch {
      showAlert('Failed to delete team', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showAlert('Role updated successfully.');
      loadUsers();
    } catch {
      showAlert('Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteUser(id);
      showAlert('User deleted.');
      loadUsers();
    } catch {
      showAlert('Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          {alert.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Teams */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700 }}>Teams</h3>
            <button className="btn btn-primary btn-sm" onClick={openCreate}>+ New Team</button>
          </div>
          {teams.length === 0 ? (
            <div className="empty-state"><p>No teams yet.</p></div>
          ) : teams.map(t => (
            <div key={t.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  {t.description && (
                    <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {t.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-icon" onClick={() => openEdit(t)} title="Edit">✎</button>
                  <button
                    className="btn-icon"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleDeleteTeam(t.id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Users — only visible to ADMIN */}
        {isAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Users</h3>
              <div style={{ position: 'relative' }}>
                <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                  width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  className="form-control"
                  style={{ paddingLeft: 28, width: 180, fontSize: '.8rem' }}
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>User</th><th>Role</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="avatar" style={{ width: 28, height: 28, fontSize: '.7rem' }}>
                              {u.username?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: '.875rem' }}>{u.username}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{ width: 120, fontSize: '.8rem', padding: '5px 8px' }}
                            value={u.role}
                            onChange={e => handleRoleChange(u.id, e.target.value)}
                          >
                            <option value="ROLE_MEMBER">Member</option>
                            <option value="ROLE_MANAGER">Manager</option>
                            <option value="ROLE_ADMIN">Admin</option>
                          </select>
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDeleteUser(u.id)}
                            title="Delete"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTeamForm && (
        <Modal title={editTeam ? 'Edit Team' : 'New Team'} onClose={() => setShowTeamForm(false)}>
          <form onSubmit={handleTeamSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input
                  className="form-control"
                  placeholder="Team name"
                  value={teamForm.name}
                  onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Description"
                  value={teamForm.description}
                  onChange={e => setTeamForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeamForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editTeam ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default TeamManagement;
