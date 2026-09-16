import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTaskById, updateTask,
  getCommentsByTask, createComment,
  getAttachmentsByTask, createAttachment,
  getSprints, getUsers,
} from '../services/api';
import useAuth from '../hooks/useAuth';

const PRIORITY_BADGE = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_BADGE = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', DONE: 'badge-done' };

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const isAdmin = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

  const [task, setTask] = useState(null);
  const [form, setForm] = useState({});
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [attachUrl, setAttachUrl] = useState('');
  const [attachType, setAttachType] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const loadComments = () =>
    getCommentsByTask(id).then(r => setComments(r.data)).catch(() => {});

  const loadAttachments = () =>
    getAttachmentsByTask(id).then(r => setAttachments(r.data)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    const requests = [
      getTaskById(id),
      getCommentsByTask(id),
      getAttachmentsByTask(id),
      getSprints(),
    ];
    // Only admins/managers can call /api/users (requires ADMIN role on backend)
    if (isAdmin) requests.push(getUsers());

    Promise.all(requests)
      .then(results => {
        const [t, c, a, s, u] = results;
        setTask(t.data);
        setForm({
          title: t.data.title,
          description: t.data.description || '',
          status: t.data.status || 'TODO',
          priority: t.data.priority || 'MEDIUM',
          dueDate: t.data.dueDate || '',
          sprint: t.data.sprint?.id || '',
          assignedTo: t.data.assignedTo?.id || '',
        });
        setComments(c.data);
        setAttachments(a.data);
        setSprints(s.data);
        if (u) setUsers(u.data);
      })
      .catch(() => showAlert('Task-specific failure during load', 'error'))
      .finally(() => setLoading(false));
  }, [id, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      // Send only the fields the backend TaskService.updateTask() actually uses:
      // title, description, status, priority, dueDate, assignedTo
      // Sprint is NOT updated by TaskService.updateTask — omit to avoid confusion
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo ? { id: Number(form.assignedTo) } : null,
        // Include sprint so it's preserved (backend ignores it in updateTask but won't break)
        sprint: form.sprint ? { id: Number(form.sprint) } : null,
      };
      await updateTask(id, payload);
      showAlert('Task updated successfully.');
      // Refresh task to show updated info panel
      getTaskById(id).then(r => setTask(r.data)).catch(() => {});
    } catch {
      showAlert('Failed to update task', 'error');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await createComment({
        content: commentText,
        task: { id: Number(id) },
        user: { id: user?.id },
      });
      setCommentText('');
      loadComments();
    } catch {
      showAlert('Failed to add comment', 'error');
    }
  };

  const handleAttachment = async (e) => {
    e.preventDefault();
    if (!attachUrl.trim()) return;
    try {
      // Backend Attachment model has: fileUrl, fileType — no fileName field
      await createAttachment({
        fileUrl: attachUrl,
        fileType: attachType || 'link',
        task: { id: Number(id) },
      });
      setAttachUrl('');
      setAttachType('');
      loadAttachments();
      showAlert('Attachment added.');
    } catch {
      showAlert('Failed to add attachment', 'error');
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!task) return <div className="alert alert-error">Task not found.</div>;

  return (
    <div>
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`} role="alert">
          {alert.msg}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge ${STATUS_BADGE[task.status] || 'badge-todo'}`}>{task.status}</span>
          {task.priority && (
            <span className={`badge ${PRIORITY_BADGE[task.priority] || ''}`}>{task.priority}</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Left column */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Task Details</h3></div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    className="form-control"
                    value={form.title || ''}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    value={form.description || ''}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={form.status || 'TODO'}
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
                      value={form.priority || 'MEDIUM'}
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
                      value={form.dueDate || ''}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sprint</label>
                    <select
                      className="form-control"
                      value={form.sprint || ''}
                      onChange={e => setForm(f => ({ ...f, sprint: e.target.value }))}
                    >
                      <option value="">No Sprint</option>
                      {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label">Assigned To</label>
                    <select
                      className="form-control"
                      value={form.assignedTo || ''}
                      onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                )}
                <button type="submit" className="btn btn-primary">Update Task</button>
              </form>
            </div>
          </div>

          {/* Comments */}
          <div className="card">
            <div className="card-header"><h3>Comments ({comments.length})</h3></div>
            <div className="card-body">
              {comments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: 16 }}>
                  No comments yet.
                </p>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: '.65rem' }}>
                          {c.user?.username?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <strong style={{ fontSize: '.8rem' }}>{c.user?.username || 'User'}</strong>
                        {c.createdAt && (
                          <small style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>
                            {new Date(c.createdAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                      <p style={{ fontSize: '.875rem', paddingLeft: 34 }}>{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-control"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">Post</button>
              </form>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Attachments — backend fields: fileUrl, fileType */}
          <div className="card">
            <div className="card-header"><h3>Attachments ({attachments.length})</h3></div>
            <div className="card-body">
              {attachments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '.875rem', marginBottom: 16 }}>
                  No attachments.
                </p>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {attachments.map(a => (
                    <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '.875rem' }}>
                      <a
                        href={a.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary)', fontWeight: 500 }}
                      >
                        📎 {a.fileType ? `[${a.fileType}] ` : ''}{a.fileUrl}
                      </a>
                    </div>
                  ))}
                </div>
              )}
              <form onSubmit={handleAttachment}>
                <div className="form-group">
                  <label className="form-label">File URL *</label>
                  <input
                    className="form-control"
                    placeholder="https://..."
                    value={attachUrl}
                    onChange={e => setAttachUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">File Type</label>
                  <input
                    className="form-control"
                    placeholder="e.g. pdf, image, link"
                    value={attachType}
                    onChange={e => setAttachType(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary btn-sm w-full"
                  style={{ justifyContent: 'center' }}
                >
                  Add Attachment
                </button>
              </form>
            </div>
          </div>

          {/* Info panel */}
          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header"><h3>Info</h3></div>
            <div className="card-body">
              {[
                { label: 'Assigned To', value: task.assignedTo?.username || 'Unassigned' },
                { label: 'Sprint', value: task.sprint?.name || 'No Sprint' },
                { label: 'Due Date', value: task.dueDate || 'No due date' },
                { label: 'Status', value: task.status || '—' },
                { label: 'Priority', value: task.priority || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '.875rem', marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;
