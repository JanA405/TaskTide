import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasksByUser, getTasks, createTask, deleteTask, getSprints, getUsers } from '../services/api';
import useAuth from '../hooks/useAuth';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_CONFIG = {
  TODO: {
    label: 'To Do',
    color: '#64748b',
    borderColor: '#cbd5e1',
    badgeClass: 'badge badge-todo',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#0284c7',
    borderColor: '#bae6fd',
    badgeClass: 'badge badge-inprogress',
  },
  DONE: {
    label: 'Completed',
    color: '#16a34a',
    borderColor: '#bbf7d0',
    badgeClass: 'badge badge-done',
  },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', class: 'badge badge-low' },
  MEDIUM: { label: 'Medium', class: 'badge badge-medium' },
  HIGH: { label: 'High', class: 'badge badge-high' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
  sprint: '',
  assignedTo: '',
};

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

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.roles?.[0];
  const isAdmin = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    const req = isAdmin ? getTasks() : getTasksByUser(user.id);
    req
      .then((r) => setTasks(r.data))
      .catch(() => setError('Failed to load tasks from server.'))
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    load();
    getSprints().then((r) => setSprints(r.data)).catch(() => {});
    if (isAdmin) {
      getUsers().then((r) => setUsers(r.data)).catch(() => {});
    }
  }, [user, isAdmin, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        sprint: form.sprint ? { id: Number(form.sprint) } : null,
        assignedTo: form.assignedTo
          ? { id: Number(form.assignedTo) }
          : user ? { id: user.id } : null,
      };
      await createTask(payload);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      showAlert('Task created successfully!');
      load();
    } catch {
      showAlert('Failed to create task', 'error');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    try {
      await deleteTask(id);
      showAlert('Task deleted successfully.');
      load();
    } catch {
      showAlert('Failed to delete task', 'error');
    }
  };

  const filtered = tasks.filter((t) => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const byStatus = (s) => filtered.filter((t) => t.status === s);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Sprint & Task Board</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: '0.92rem' }}>
            {isAdmin ? 'Visualizing all workspace tasks across pipelines' : 'Your personally assigned deliverables and tasks'}
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create New Task
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

      {error && (
        <div className="alert alert-error" role="alert">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: 24, padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
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
              placeholder="Filter tasks by keyword or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 160, fontSize: '0.86rem' }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>

          <button className="btn btn-secondary btn-sm" onClick={load} title="Reload Board">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Kanban Board Columns */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <div className="board">
          {STATUSES.map((status) => {
            const config = STATUS_CONFIG[status];
            const colTasks = byStatus(status);
            return (
              <div key={status} className="board-col" style={{ borderTop: `3px solid ${config.color}` }}>
                <div className="board-col-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: config.color }} />
                    <span>{config.label}</span>
                  </div>
                  <span className="col-count-pill">{colTasks.length}</span>
                </div>

                {colTasks.length === 0 ? (
                  <div className="empty-state" style={{ padding: '36px 16px', margin: 'auto 0' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    <p style={{ marginTop: 8 }}>No tasks in this lane</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="task-card"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <h4>{task.title}</h4>
                      {task.description && <p>{task.description}</p>}

                      <div className="task-card-footer">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span className={config.badgeClass}>
                            <span className="badge-dot" />
                            {config.label}
                          </span>

                          {task.priority && (
                            <span className={PRIORITY_CONFIG[task.priority]?.class || 'badge'}>
                              {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                          {task.dueDate && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              {task.dueDate}
                            </span>
                          )}

                          <button
                            className="btn btn-icon"
                            style={{ width: 26, height: 26, color: 'var(--danger)' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(task.id, task.title);
                            }}
                            title="Delete Task"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Create Task Modal */}
      {showCreate && (
        <Modal title="Create New Task" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  className="form-control"
                  placeholder="e.g. Implement user authentication middleware"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Task Description</label>
                <textarea
                  className="form-control"
                  placeholder="Provide technical specifications, context, or acceptance criteria..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Workflow Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sprint Association</label>
                  <select
                    className="form-control"
                    value={form.sprint}
                    onChange={(e) => setForm((f) => ({ ...f, sprint: e.target.value }))}
                  >
                    <option value="">No Assigned Sprint</option>
                    {sprints.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-control"
                    value={form.assignedTo}
                    onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Assign to myself ({user?.username})</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.fullName || u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Confirm & Create Task
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
