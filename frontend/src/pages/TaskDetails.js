import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTaskById,
  updateTask,
  getCommentsByTask,
  createComment,
  getAttachmentsByTask,
  createAttachment,
  getSprints,
  getUsers,
} from '../services/api';
import useAuth from '../hooks/useAuth';

const PRIORITY_BADGE = { LOW: 'badge badge-low', MEDIUM: 'badge badge-medium', HIGH: 'badge badge-high' };
const STATUS_BADGE = { TODO: 'badge badge-todo', IN_PROGRESS: 'badge badge-inprogress', DONE: 'badge badge-done' };

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
    setTimeout(() => setAlert(null), 3500);
  };

  const loadComments = () =>
    getCommentsByTask(id).then((r) => setComments(r.data)).catch(() => {});

  const loadAttachments = () =>
    getAttachmentsByTask(id).then((r) => setAttachments(r.data)).catch(() => {});

  useEffect(() => {
    setLoading(true);
    const requests = [
      getTaskById(id),
      getCommentsByTask(id),
      getAttachmentsByTask(id),
      getSprints(),
    ];
    if (isAdmin) requests.push(getUsers());

    Promise.all(requests)
      .then((results) => {
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
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        assignedTo: form.assignedTo ? { id: Number(form.assignedTo) } : null,
        sprint: form.sprint ? { id: Number(form.sprint) } : null,
      };
      await updateTask(id, payload);
      showAlert('Task specifications updated successfully.');
      getTaskById(id).then((r) => setTask(r.data)).catch(() => {});
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
      showAlert('Comment added to discussion.');
    } catch {
      showAlert('Failed to add comment', 'error');
    }
  };

  const handleAttachment = async (e) => {
    e.preventDefault();
    if (!attachUrl.trim()) return;
    try {
      await createAttachment({
        fileUrl: attachUrl,
        fileType: attachType || 'link',
        task: { id: Number(id) },
      });
      setAttachUrl('');
      setAttachType('');
      loadAttachments();
      showAlert('Attachment linked to task.');
    } catch {
      showAlert('Failed to add attachment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="alert alert-error">
        <span>Task not found or has been deleted.</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1300, margin: '0 auto' }}>
      {/* Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Board
        </button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={STATUS_BADGE[task.status] || 'badge'}>
            <span className="badge-dot" />
            {task.status}
          </span>
          {task.priority && (
            <span className={PRIORITY_BADGE[task.priority] || 'badge'}>
              {task.priority} Priority
            </span>
          )}
        </div>
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

      {/* Main 2-Column Details Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left Column: Editor & Comments */}
        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h3>Task Specifications</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleUpdate}>
                <div className="form-group">
                  <label className="form-label">Task Title *</label>
                  <input
                    className="form-control"
                    value={form.title || ''}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Task Description</label>
                  <textarea
                    className="form-control"
                    value={form.description || ''}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    style={{ minHeight: 120 }}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Workflow Status</label>
                    <select
                      className="form-control"
                      value={form.status || 'TODO'}
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
                      value={form.priority || 'MEDIUM'}
                      onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
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
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sprint Association</label>
                    <select
                      className="form-control"
                      value={form.sprint || ''}
                      onChange={(e) => setForm((f) => ({ ...f, sprint: e.target.value }))}
                    >
                      <option value="">No Sprint Assigned</option>
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
                      value={form.assignedTo || ''}
                      onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.fullName || u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>
                  Save Task Changes
                </button>
              </form>
            </div>
          </div>

          {/* Discussion & Comments */}
          <div className="card">
            <div className="card-header">
              <h3>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Discussion ({comments.length})
              </h3>
            </div>

            <div className="card-body">
              {comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.88rem' }}>No comments yet. Start the conversation!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '14px 16px',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.72rem' }}>
                          {c.user?.username?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text)' }}>
                          {c.user?.username || 'Team Member'}
                        </strong>
                        {c.createdAt && (
                          <small style={{ color: 'var(--text-dim)', fontSize: '0.74rem', marginLeft: 'auto' }}>
                            {new Date(c.createdAt).toLocaleDateString()}
                          </small>
                        )}
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-body)', lineHeight: 1.5, paddingLeft: 38 }}>
                        {c.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleComment} style={{ display: 'flex', gap: 10 }}>
                <input
                  className="form-control"
                  placeholder="Type your reply or feedback..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  required
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata & Attachments */}
        <div>
          {/* Metadata Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3>Task Metadata</h3>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Assigned Member', value: task.assignedTo?.username || 'Unassigned' },
                { label: 'Sprint Cycle', value: task.sprint?.name || 'Backlog' },
                { label: 'Target Deadline', value: task.dueDate || 'Open' },
                { label: 'Current State', value: task.status || '—' },
                { label: 'Urgency / Priority', value: task.priority || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {label}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', marginTop: 4 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attachments Card */}
          <div className="card">
            <div className="card-header">
              <h3>Attachments ({attachments.length})</h3>
            </div>
            <div className="card-body">
              {attachments.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: 16 }}>
                  No resources or links attached.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                  {attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.82rem',
                        color: 'var(--primary)',
                        padding: '8px 10px',
                        background: 'rgba(2, 132, 199, 0.08)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #bae6fd',
                        wordBreak: 'break-all',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                      </svg>
                      {a.fileType ? `[${a.fileType}] ` : ''}
                      {a.fileUrl}
                    </a>
                  ))}
                </div>
              )}

              <form onSubmit={handleAttachment}>
                <div className="form-group">
                  <label className="form-label">Resource / URL *</label>
                  <input
                    className="form-control"
                    placeholder="https://..."
                    value={attachUrl}
                    onChange={(e) => setAttachUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Type Label</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Design, Doc, PR"
                    value={attachType}
                    onChange={(e) => setAttachType(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm w-full" style={{ justifyContent: 'center' }}>
                  + Attach Link
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;
