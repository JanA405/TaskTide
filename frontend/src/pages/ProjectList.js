import { useEffect, useState } from 'react';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getTeams,
  getSprintsByProject,
  createSprint,
  updateSprint,
  deleteSprint,
} from '../services/api';
import useAuth from '../hooks/useAuth';

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const EMPTY_PROJECT = { name: '', description: '', startDate: '', endDate: '', team: '' };
const EMPTY_SPRINT = { name: '', startDate: '', endDate: '' };

function ProjectList() {
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const canManage = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Project form
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [form, setForm] = useState(EMPTY_PROJECT);

  // Sprint modal
  const [sprintModal, setSprintModal] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [sprintForm, setSprintForm] = useState(EMPTY_SPRINT);
  const [editSprint, setEditSprint] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const load = () => {
    setLoading(true);
    getProjects()
      .then((r) => setProjects(r.data))
      .catch(() => showAlert('Failed to load projects', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getTeams()
      .then((r) => setTeams(r.data))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditProject(null);
    setForm(EMPTY_PROJECT);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      name: p.name,
      description: p.description || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      team: p.team?.id || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      team: form.team ? { id: Number(form.team) } : null,
    };
    try {
      if (editProject) {
        await updateProject(editProject.id, payload);
        showAlert('Project updated successfully.');
      } else {
        await createProject(payload);
        showAlert('Project created successfully.');
      }
      setShowForm(false);
      load();
    } catch {
      showAlert('Failed to save project', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}" and all associated data?`)) return;
    try {
      await deleteProject(id);
      showAlert('Project deleted successfully.');
      load();
    } catch {
      showAlert('Failed to delete project', 'error');
    }
  };

  const openSprints = async (project) => {
    setSprintModal(project);
    setSprintForm(EMPTY_SPRINT);
    setEditSprint(null);
    try {
      const r = await getSprintsByProject(project.id);
      setSprints(r.data);
    } catch {
      setSprints([]);
    }
  };

  const reloadSprints = async (projectId) => {
    try {
      const r = await getSprintsByProject(projectId);
      setSprints(r.data);
    } catch {
      setSprints([]);
    }
  };

  const handleSprintSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: sprintForm.name,
      startDate: sprintForm.startDate || null,
      endDate: sprintForm.endDate || null,
      project: { id: sprintModal.id },
    };
    try {
      if (editSprint) {
        await updateSprint(editSprint.id, payload);
        showAlert('Sprint updated.');
      } else {
        await createSprint(payload);
        showAlert('Sprint created.');
      }
      setSprintForm(EMPTY_SPRINT);
      setEditSprint(null);
      reloadSprints(sprintModal.id);
    } catch {
      showAlert('Failed to save sprint', 'error');
    }
  };

  const handleDeleteSprint = async (id) => {
    if (!window.confirm('Delete this sprint?')) return;
    try {
      await deleteSprint(id);
      showAlert('Sprint deleted.');
      reloadSprints(sprintModal.id);
    } catch {
      showAlert('Failed to delete sprint', 'error');
    }
  };

  const startEditSprint = (s) => {
    setEditSprint(s);
    setSprintForm({ name: s.name, startDate: s.startDate || '', endDate: s.endDate || '' });
  };

  const filtered = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Project Portfolio</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
            Coordinate releases, track team assignments, and manage sprint milestones.
          </p>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={openCreate}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create New Project
          </button>
        )}
      </div>

      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ marginBottom: 24, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
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
              style={{ paddingLeft: 36, fontSize: '0.86rem' }}
              placeholder="Search projects by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-secondary btn-sm" onClick={load} title="Refresh Projects">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state" style={{ padding: '60px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📁</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>No projects discovered</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, maxWidth: 400, margin: '6px auto 16px' }}>
            {search ? 'Try adjusting your search criteria.' : 'Create your first project to start organizing team sprints.'}
          </p>
          {canManage && !search && (
            <button className="btn btn-primary" onClick={openCreate}>
              + Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              className="card card-interactive"
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderTop: '3px solid #0284c7',
              }}
            >
              <div className="card-header" style={{ alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', wordBreak: 'break-word' }}>
                    {p.name}
                  </h3>
                  {p.team && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0284c7',
                        background: 'rgba(2, 132, 199, 0.08)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        marginTop: 6,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      {p.team.name}
                    </span>
                  )}
                </div>

                {canManage && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn-icon" title="Edit Project" onClick={() => openEdit(p)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon"
                      title="Delete Project"
                      onClick={() => handleDelete(p.id, p.name)}
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 16, flex: 1, lineHeight: 1.5 }}>
                  {p.description || 'No project description provided.'}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                    padding: '10px 12px',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 16,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {p.startDate || 'No start date'}
                  </span>
                  {p.endDate && (
                    <span>→ {p.endDate}</span>
                  )}
                </div>

                <button
                  className="btn btn-secondary w-full"
                  onClick={() => openSprints(p)}
                  style={{ justifyContent: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  Manage Sprints
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Modal */}
      {showForm && (
        <Modal title={editProject ? 'Edit Project' : 'Create New Project'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  className="form-control"
                  placeholder="e.g. NextGen Web Platform"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Summarize project scope, goals, and targets..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Completion</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Team</label>
                <select
                  className="form-control"
                  value={form.team}
                  onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
                >
                  <option value="">No Team Assigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editProject ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sprints Modal */}
      {sprintModal && (
        <Modal title={`Sprints — ${sprintModal.name}`} onClose={() => setSprintModal(null)}>
          <div className="modal-body">
            <form onSubmit={handleSprintSubmit} style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">
                  {editSprint ? 'Edit Sprint' : 'New Sprint Name'} *
                </label>
                <input
                  className="form-control"
                  placeholder="e.g. Sprint 1 - MVP Alpha"
                  value={sprintForm.name}
                  onChange={(e) => setSprintForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={sprintForm.startDate}
                    onChange={(e) => setSprintForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={sprintForm.endDate}
                    onChange={(e) => setSprintForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editSprint ? 'Update Sprint' : '+ Add Sprint'}
                </button>
                {editSprint && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditSprint(null);
                      setSprintForm(EMPTY_SPRINT);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={{ height: 1, background: 'var(--border)', margin: '18px 0' }} />

            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Existing Sprints</h4>
            {sprints.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>No sprints scheduled yet for this project.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sprint</th>
                      <th>Start</th>
                      <th>End</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sprints.map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.startDate || '—'}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{s.endDate || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn-icon" onClick={() => startEditSprint(s)} title="Edit">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                              </svg>
                            </button>
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteSprint(s.id)}
                              title="Delete"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ProjectList;
