import { useEffect, useState } from 'react';
import { getTeams, createTeam, updateTeam, deleteTeam, getUsers, updateUserRole, deleteUser } from '../services/api';
import useAuth from '../hooks/useAuth';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
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
    setTimeout(() => setAlert(null), 3500);
  };

  const loadTeams = () =>
    getTeams().then((r) => setTeams(r.data)).catch(() => showAlert('Failed to load teams', 'error'));

  const loadUsers = () => {
    if (!isAdmin) return;
    getUsers().then((r) => setUsers(r.data)).catch(() => {});
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
        showAlert('Team details updated successfully.');
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

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Delete team "${name}"?`)) return;
    try {
      await deleteTeam(id);
      showAlert('Team removed successfully.');
      loadTeams();
    } catch {
      showAlert('Failed to delete team', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      showAlert('User role updated successfully.');
      loadUsers();
    } catch {
      showAlert('Failed to update role', 'error');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Remove user "${username}"?`)) return;
    try {
      await deleteUser(id);
      showAlert('User removed.');
      loadUsers();
    } catch {
      showAlert('Failed to delete user', 'error');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1350, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Teams & Squads</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
            Structure cross-functional squads, project allocations, and team members.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Squad / Team
        </button>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <span>{alert.msg}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1.1fr' : '1fr', gap: 24 }}>
        {/* Teams List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Registered Teams ({teams.length})
            </h3>
          </div>

          {teams.length === 0 ? (
            <div className="card empty-state" style={{ padding: '48px 20px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👥</div>
              <p style={{ fontWeight: 600, color: 'var(--text)' }}>No teams configured yet.</p>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Create a team to start grouping project tasks.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {teams.map((t) => (
                <div key={t.id} className="card card-interactive">
                  <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: 'rgba(2, 132, 199, 0.08)',
                          border: '1px solid #bae6fd',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {t.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text)' }}>{t.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3 }}>
                          {t.description || 'No description assigned.'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" onClick={() => openEdit(t)} title="Edit Team">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                      </button>
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleDeleteTeam(t.id, t.name)}
                        title="Delete Team"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users (Admin View) */}
        {isAdmin && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Workspace Members</h3>
              <div style={{ position: 'relative', width: 220 }}>
                <svg
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', pointerEvents: 'none' }}
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  className="form-control"
                  style={{ paddingLeft: 32, fontSize: '0.82rem', padding: '7px 10px 7px 32px' }}
                  placeholder="Filter members..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Role Level</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                              {u.username?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text)' }}>{u.username}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            style={{ width: 130, fontSize: '0.8rem', padding: '5px 8px' }}
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
                            className="btn btn-icon"
                            style={{ color: 'var(--danger)', width: 28, height: 28 }}
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Remove Member"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>
                          No members found.
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
        <Modal title={editTeam ? 'Edit Team Details' : 'Create New Team'} onClose={() => setShowTeamForm(false)}>
          <form onSubmit={handleTeamSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Frontend Engineering, Product Design"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team Description / Mission</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the squad focus, deliverables, or team charter..."
                  value={teamForm.description}
                  onChange={(e) => setTeamForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeamForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editTeam ? 'Save Team' : 'Create Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default TeamManagement;
