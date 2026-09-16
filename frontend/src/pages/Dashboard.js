import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTasksByUser, getTasks, createTask, deleteTask, getSprints, getUsers } from '../services/api';
import useAuth from '../hooks/useAuth';

const STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const STATUS_LABELS = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const PRIORITY_BADGE = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_BADGE = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', DONE: 'badge-done' };
const EMPTY_FORM = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', sprint: '', assignedTo: '' };

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
    setTimeout(() => setAlert(null), 3000);
  };

  // useCallback so load can be called from handlers without stale closure
  const load = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);
    const req = isAdmin ? getTasks() : getTasksByUser(user.id);
    req
      .then(r => setTasks(r.data))
      .catch(() => setError('Task-specific failure during load'))
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user?.id) return;
    load();
    getSprints().then(r => setSprints(r.data)).catch(() => {});
    // Only admins/managers can call /api/users
    if (isAdmin) {
      getUsers().then(r => setUsers(r.data)).catch(() => {});
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
      showAlert('Task created successfully.');
      load();
    } catch {
      showAlert('Failed to create task', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(id);
      showAlert('Task deleted successfully.');
      load();
    } catch {
      showAlert('Failed to delete task', 'error');
    }
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    return matchSearch && matchPriority;
  });

  const byStatus = (s) => filtered.filter(t => t.status === s);

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          {alert.msg}
        </div>
      )}
      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="form-control"
              style={{ paddingLeft: 32, width: 220 }}
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-control"
            style={{ width: 140 }}
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Task</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="board">
          {STATUSES.map(status => (
            <div key={status} className="board-col">
              <div className="board-col-header">
                <span>{STATUS_LABELS[status]}</span>
                <span className="badge badge-todo" style={{ fontSize: '.7rem' }}>
                  {byStatus(status).length}
                </span>
              </div>
              {byStatus(status).length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 12px' }}>
                  <p>No tasks</p>
                </div>
              ) : byStatus(status).map(task => (
                <div
                  key={task.id}
                  className="task-card"
                  onClick={() => navigate(`/tasks/${task.id}`)}
                >
                  <h4>{task.title}</h4>
                  {task.description && <p>{task.description}</p>}
                  <div className="task-card-footer">
                    <span className={`badge ${STATUS_BADGE[task.status] || 'badge-todo'}`}>
                      {task.status}
                    </span>
                    {task.priority && (
                      <span className={`badge ${PRIORITY_BADGE[task.priority] || ''}`}>
                        {task.priority}
                      </span>
                    )}
                    {task.dueDate && (
                      <small style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>
                        📅 {task.dueDate}
                      </small>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: 'auto' }}
                      onClick={e => { e.stopPropagation(); handleDelete(task.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Task" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-control"
                  placeholder="Task title"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
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
                  <label className="form-label">Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
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
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sprint</label>
                  <select
                    className="form-control"
                    value={form.sprint}
                    onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))}
                  >
                    <option value="">No Sprint</option>
                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-control"
                    value={form.assignedTo}
                    onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  >
                    <option value="">Assign to me</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">Create Task</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
