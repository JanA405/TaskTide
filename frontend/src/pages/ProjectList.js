import { useEffect, useState } from 'react';
import {
  getProjects, createProject, updateProject, deleteProject,
  getTeams, getSprintsByProject, createSprint, updateSprint, deleteSprint,
} from '../services/api';
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
    setTimeout(() => setAlert(null), 3000);
  };

  const load = () => {
    setLoading(true);
    getProjects()
      .then(r => setProjects(r.data))
      .catch(() => showAlert('Failed to load projects', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    getTeams().then(r => setTeams(r.data)).catch(() => {});
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

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
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

  const filtered = projects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          {alert.msg}
        </div>
      )}

      <div className="toolbar">
        <div className="toolbar-left">
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="form-control"
              style={{ paddingLeft: 32, width: 240 }}
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        {canManage && (
          <div className="toolbar-right">
            <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><p>No projects found.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card">
              <div className="card-header">
                <div>
                  <h3 style={{ fontSize: '1rem' }}>{p.name}</h3>
                  {p.team && (
                    <small style={{ color: 'var(--text-muted)' }}>Team: {p.team.name}</small>
                  )}
                </div>
                {canManage && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-icon" title="Edit" onClick={() => openEdit(p)}>✎</button>
                    <button
                      className="btn-icon"
                      title="Delete"
                      onClick={() => handleDelete(p.id)}
                      style={{ color: 'var(--danger)' }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <div className="card-body">
                {p.description && (
                  <p style={{ fontSize: '.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    {p.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  {p.startDate && <span>📅 {p.startDate}</span>}
                  {p.endDate && <span>→ {p.endDate}</span>}
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => openSprints(p)}>
                  View Sprints
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project create/edit modal */}
      {showForm && (
        <Modal title={editProject ? 'Edit Project' : 'New Project'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  className="form-control"
                  placeholder="Project name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.endDate}
                    onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Team</label>
                <select
                  className="form-control"
                  value={form.team}
                  onChange={e => setForm(f => ({ ...f, team: e.target.value }))}
                >
                  <option value="">No Team</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editProject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Sprint management modal */}
      {sprintModal && (
        <Modal title={`Sprints — ${sprintModal.name}`} onClose={() => setSprintModal(null)}>
          <div className="modal-body">
            <form onSubmit={handleSprintSubmit} style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">
                  {editSprint ? 'Edit Sprint' : 'New Sprint'} Name *
                </label>
                <input
                  className="form-control"
                  placeholder="Sprint name"
                  value={sprintForm.name}
                  onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start</label>
                  <input
                    type="date"
                    className="form-control"
                    value={sprintForm.startDate}
                    onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End</label>
                  <input
                    type="date"
                    className="form-control"
                    value={sprintForm.endDate}
                    onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editSprint ? 'Update Sprint' : 'Add Sprint'}
                </button>
                {editSprint && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditSprint(null); setSprintForm(EMPTY_SPRINT); }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            <div className="divider" />
            {sprints.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>No sprints yet.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Start</th><th>End</th><th></th></tr>
                  </thead>
                  <tbody>
                    {sprints.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.startDate || '—'}</td>
                        <td>{s.endDate || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-icon" onClick={() => startEditSprint(s)} title="Edit">✎</button>
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger)' }}
                              onClick={() => handleDeleteSprint(s.id)}
                              title="Delete"
                            >
                              ✕
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
