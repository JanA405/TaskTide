import { useEffect, useState, useCallback } from 'react';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getUsers,
  addTeamMember,
  removeTeamMember,
  getProjects,
  getTasks,
} from '../services/api';
import useAuth from '../hooks/useAuth';

import teamHero from '../assets/team_collaboration.jpg';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>
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
  const isManager = role === 'ROLE_MANAGER';

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  // Team Create / Edit Form Modal
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editTeam, setEditTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ name: '', description: '', projectId: '' });

  // Manage Members Modal
  const [managingTeam, setManagingTeam] = useState(null);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadData = useCallback(() => {
    Promise.all([
      getTeams().then((r) => r.data).catch(() => []),
      getUsers().then((r) => r.data).catch(() => []),
      getProjects().then((r) => r.data).catch(() => []),
      getTasks().then((r) => r.data).catch(() => []),
    ]).then(([tData, uData, pData, tkData]) => {
      setTeams(tData);
      setUsers(uData);
      setProjects(pData);
      setTasks(tkData);

      // Refresh managing team if currently open
      if (managingTeam) {
        const refreshed = tData.find((t) => t.id === managingTeam.id);
        if (refreshed) setManagingTeam(refreshed);
      }
    });
  }, [managingTeam]);

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditTeam(null);
    setTeamForm({ name: '', description: '', projectId: '' });
    setShowTeamForm(true);
  };

  const openEdit = (t) => {
    setEditTeam(t);
    setTeamForm({ name: t.name, description: t.description || '', projectId: '' });
    setShowTeamForm(true);
  };

  const handleTeamSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editTeam) {
        await updateTeam(editTeam.id, {
          name: teamForm.name,
          description: teamForm.description,
        });
        showAlert('Team details updated successfully.');
      } else {
        await createTeam({
          name: teamForm.name,
          description: teamForm.description,
        });
        showAlert('Team created successfully!');
      }
      setShowTeamForm(false);
      loadData();
    } catch {
      showAlert('Failed to save team details.', 'error');
    }
  };

  const handleDeleteTeam = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete team "${name}"?`)) return;
    try {
      await deleteTeam(id);
      showAlert(`Team "${name}" deleted successfully.`);
      loadData();
    } catch {
      showAlert('Failed to delete team.', 'error');
    }
  };

  const handleOpenMembers = (team) => {
    setManagingTeam(team);
    setSelectedUserIdToAdd('');
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserIdToAdd || !managingTeam) return;

    try {
      await addTeamMember(managingTeam.id, selectedUserIdToAdd);
      showAlert('Member added to team successfully!');
      setSelectedUserIdToAdd('');
      // Reload and update modal
      const res = await getTeams();
      setTeams(res.data);
      const updatedTeam = res.data.find((t) => t.id === managingTeam.id);
      if (updatedTeam) setManagingTeam(updatedTeam);
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Failed to add member to team.', 'error');
    }
  };

  const handleRemoveMember = async (userId, memberRole, memberName) => {
    if (!managingTeam) return;

    // Security check: PM cannot remove Admin
    if (isManager && memberRole === 'ROLE_ADMIN') {
      showAlert('Permission denied: Project Managers cannot remove Admin members.', 'error');
      return;
    }

    if (!window.confirm(`Remove "${memberName}" from team "${managingTeam.name}"?`)) return;

    try {
      await removeTeamMember(managingTeam.id, userId);
      showAlert(`Removed "${memberName}" from team.`);
      const res = await getTeams();
      setTeams(res.data);
      const updatedTeam = res.data.find((t) => t.id === managingTeam.id);
      if (updatedTeam) setManagingTeam(updatedTeam);
    } catch {
      showAlert('Failed to remove member.', 'error');
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Team & Group Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: 4 }}>
            Organize squads, associate projects, add multiple members, and monitor group-level task progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Team
          </button>
          <button className="btn btn-secondary" onClick={loadData} title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`}>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card" style={{ padding: 16 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search teams by name or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)' }}>No teams found. Click "Create Team" to set up your first group.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filteredTeams.map((t) => {
            const memberCount = t.members ? t.members.length : 0;
            const teamProjects = projects.filter((p) => p.team?.id === t.id);
            const teamTasks = tasks.filter((tk) => tk.team?.id === t.id);
            const completedCount = teamTasks.filter((tk) => tk.status === 'APPROVED' || tk.status === 'DONE').length;
            const progressPercent = teamTasks.length > 0 ? Math.round((completedCount / teamTasks.length) * 100) : 0;

            return (
              <div key={t.id} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                      {t.description || 'No description provided.'}
                    </p>
                  </div>
                  <span className="badge badge-member">{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
                </div>

                {/* Team Members Avatar Stack */}
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>
                    ROSTER & MEMBERS:
                  </div>
                  {memberCount === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No members assigned yet
                    </span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {t.members.slice(0, 6).map((m) => (
                        <span
                          key={m.id}
                          title={`${m.fullName || m.username} (${m.role})`}
                          style={{
                            fontSize: '0.78rem',
                            background: 'var(--bg-subtle)',
                            padding: '3px 8px',
                            borderRadius: 6,
                            border: '1px solid var(--border)',
                          }}
                        >
                          👤 {m.username}
                        </span>
                      ))}
                      {memberCount > 6 && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                          +{memberCount - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Assigned Projects */}
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                    ASSIGNED PROJECTS:
                  </div>
                  {teamProjects.length === 0 ? (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>None assigned</span>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {teamProjects.map((p) => (
                        <span key={p.id} className="badge badge-inprogress" style={{ fontSize: '0.75rem' }}>
                          📁 {p.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Task Progress */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Group Task Completion</span>
                    <strong>{completedCount} / {teamTasks.length} ({progressPercent}%)</strong>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: '#16a34a' }} />
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 'auto' }}>
                  <button className="btn btn-sm btn-primary" onClick={() => handleOpenMembers(t)}>
                    👥 Manage Members
                  </button>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)} title="Edit Team">
                      Edit
                    </button>
                    {(isAdmin || isManager) && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTeam(t.id, t.name)} title="Delete Team">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create / Edit Team */}
      {showTeamForm && (
        <Modal title={editTeam ? 'Edit Team Details' : 'Create New Team'} onClose={() => setShowTeamForm(false)}>
          <form onSubmit={handleTeamSubmit}>
            <div className="form-group">
              <label>Team Name *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Frontend Engineering, QA Automation, DevOps"
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Brief description of the team's charter and responsibilities..."
                value={teamForm.description}
                onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowTeamForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editTeam ? 'Save Changes' : 'Create Team'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Manage Team Members */}
      {managingTeam && (
        <Modal title={`Manage Members: ${managingTeam.name}`} onClose={() => setManagingTeam(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Add Member Form */}
            <form onSubmit={handleAddMember} style={{ background: 'var(--bg-subtle)', padding: 14, borderRadius: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Add Member to Team (Prevents Duplicates)
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <select
                  className="form-control"
                  style={{ flex: 1 }}
                  value={selectedUserIdToAdd}
                  onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                  required
                >
                  <option value="">Select a user to add...</option>
                  {users
                    // Filter out users already in this team to prevent duplicates
                    .filter((u) => !managingTeam.members?.some((m) => m.id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username} ({u.username} • {u.role})
                      </option>
                    ))}
                </select>
                <button type="submit" className="btn btn-primary" disabled={!selectedUserIdToAdd}>
                  Add Member
                </button>
              </div>
            </form>

            {/* Current Members List */}
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: 10, fontWeight: 700 }}>
                Current Team Roster ({managingTeam.members?.length || 0})
              </h4>

              {(!managingTeam.members || managingTeam.members.length === 0) ? (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  No members in this team yet. Use the dropdown above to add members.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {managingTeam.members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        background: '#fff',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>
                          {member.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.9rem' }}>{member.fullName || member.username}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            @{member.username} • {member.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className={
                            member.role === 'ROLE_ADMIN'
                              ? 'badge badge-admin'
                              : member.role === 'ROLE_MANAGER'
                              ? 'badge badge-manager'
                              : 'badge badge-member'
                          }
                        >
                          {member.role === 'ROLE_ADMIN' ? 'Admin' : member.role === 'ROLE_MANAGER' ? 'Manager' : 'Member'}
                        </span>

                        <button
                          className="btn-icon"
                          onClick={() => handleRemoveMember(member.id, member.role, member.username)}
                          title="Remove from team"
                          style={{ color: 'var(--danger)' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
              <button className="btn btn-secondary" onClick={() => setManagingTeam(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TeamManagement;
