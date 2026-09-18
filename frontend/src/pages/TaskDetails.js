import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getTaskById,
  updateTask,
  updateTaskProgress,
  submitTaskCompletion,
  approveTask,
  rejectTask,
  getCommentsByTask,
  createComment,
  getAttachmentsByTask,
  uploadAttachment,
  getTeams,
  getUsers,
} from '../services/api';
import useAuth from '../hooks/useAuth';

const STATUS_BADGE = {
  TODO: 'badge badge-todo',
  IN_PROGRESS: 'badge badge-inprogress',
  SUBMITTED: 'badge badge-submitted',
  APPROVED: 'badge badge-approved',
  REJECTED: 'badge badge-rejected',
  DONE: 'badge badge-done',
};

const PRIORITY_BADGE = {
  LOW: 'badge badge-low',
  MEDIUM: 'badge badge-medium',
  HIGH: 'badge badge-high',
};

function TaskDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.roles?.[0];
  const isAdmin = role === 'ROLE_ADMIN';
  const isManager = role === 'ROLE_MANAGER';
  const isAdminOrManager = isAdmin || isManager;

  const [task, setTask] = useState(null);
  const [form, setForm] = useState({});
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);

  // Submission form state
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);

  // Review rejection state
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadAll = useCallback(() => {
    setLoading(true);
    getTaskById(id)
      .then((t) => {
        setTask(t.data);
        setForm({
          title: t.data.title,
          description: t.data.description || '',
          status: t.data.status || 'TODO',
          priority: t.data.priority || 'MEDIUM',
          dueDate: t.data.dueDate || '',
          team: t.data.team?.id || '',
          assignedTo: t.data.assignedTo?.id || '',
          progress: t.data.progress || 0,
        });
        if (t.data.attachments) {
          setAttachments(t.data.attachments);
        }
      })
      .catch(() => setTask(null))
      .finally(() => setLoading(false));

    getCommentsByTask(id).then((r) => setComments(r.data)).catch(() => {});
    getAttachmentsByTask(id).then((r) => setAttachments(r.data)).catch(() => {});
    getTeams().then((r) => setTeams(r.data)).catch(() => {});
    if (isAdminOrManager) {
      getUsers().then((r) => setUsers(r.data)).catch(() => {});
    }
  }, [id, isAdminOrManager]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Update task specs (Admin/PM)
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        team: form.team ? { id: Number(form.team) } : null,
        assignedTo: form.assignedTo ? { id: Number(form.assignedTo) } : null,
      };
      await updateTask(id, payload);
      showAlert('Task details updated successfully.');
      loadAll();
    } catch {
      showAlert('Failed to update task details.', 'error');
    }
  };

  // Progress slider update
  const handleProgressChange = async (newVal) => {
    try {
      await updateTaskProgress(id, Number(newVal));
      setTask((prev) => ({ ...prev, progress: Number(newVal) }));
      showAlert('Progress updated to ' + newVal + '%');
    } catch {
      showAlert('Failed to update progress', 'error');
    }
  };

  // Submit deliverables (Member)
  const handleSubmitDeliverables = async (e) => {
    e.preventDefault();
    setIsSubmittingWork(true);
    try {
      const formData = new FormData();
      if (submissionNotes.trim()) {
        formData.append('notes', submissionNotes);
      }
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append('files', selectedFiles[i]);
      }
      await submitTaskCompletion(id, formData);
      showAlert('Deliverables submitted successfully! Awaiting review.');
      setSubmissionNotes('');
      setSelectedFiles([]);
      loadAll();
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Failed to submit deliverables.', 'error');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  // Quick file attachment upload
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadAttachment(id, formData);
      showAlert('Document uploaded successfully.');
      loadAll();
    } catch {
      showAlert('Failed to upload file', 'error');
    }
  };

  // Approve Task
  const handleApprove = async () => {
    try {
      await approveTask(id);
      showAlert('Task approved and marked completed! ✓');
      loadAll();
    } catch {
      showAlert('Failed to approve task.', 'error');
    }
  };

  // Reject Task
  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showAlert('Please enter a rejection reason.', 'error');
      return;
    }
    try {
      await rejectTask(id, rejectReason);
      showAlert('Task submission rejected with feedback reason.');
      setShowRejectBox(false);
      setRejectReason('');
      loadAll();
    } catch {
      showAlert('Failed to reject task.', 'error');
    }
  };

  // Add Comment
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
      getCommentsByTask(id).then((r) => setComments(r.data)).catch(() => {});
      showAlert('Comment added.');
    } catch {
      showAlert('Failed to add comment', 'error');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading task specifications...</div>;
  }

  if (!task) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48, maxWidth: 600, margin: '40px auto' }}>
        <h2>Task Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '12px 0 20px' }}>
          This task may have been deleted or moved.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const badgeStatus = STATUS_BADGE[task.status] || STATUS_BADGE.TODO;
  const badgePriority = PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.MEDIUM;
  const progressVal = task.progress || 0;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert toast */}
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`}>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={() => navigate(-1)} title="Go Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{task.title}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span className={badgeStatus}>{task.status?.replace('_', ' ')}</span>
              <span className={badgePriority}>{task.priority} Priority</span>
              {task.team && (
                <span style={{ fontSize: '0.8rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                  👥 {task.team.name}
                </span>
              )}
              {task.dueDate && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📅 Due: {task.dueDate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status indicator & quick action */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            View Board
          </button>
        </div>
      </div>

      {/* Rejection Alert Banner */}
      {task.status === 'REJECTED' && (
        <div className="rejection-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <strong style={{ color: '#e11d48', fontSize: '0.98rem' }}>
              Submission Needs Revision
            </strong>
          </div>
          <p style={{ color: '#9f1239', fontSize: '0.88rem', marginTop: 6 }}>
            <strong>Reviewer Feedback:</strong> {task.rejectionReason || 'Please review notes and submit updated documents.'}
          </p>
          {task.reviewedBy && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Reviewed by: {task.reviewedBy.fullName || task.reviewedBy.username}
            </div>
          )}
        </div>
      )}

      {/* Approval Success Banner */}
      {(task.status === 'APPROVED' || task.status === 'DONE') && (
        <div className="approval-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>✓</span>
            <strong style={{ color: '#16a34a', fontSize: '0.98rem' }}>
              Task Approved & Completed
            </strong>
          </div>
          <p style={{ color: '#15803d', fontSize: '0.88rem', marginTop: 4 }}>
            This deliverable was verified and approved by {task.reviewedBy?.fullName || task.reviewedBy?.username || 'the team leadership'}.
          </p>
        </div>
      )}

      {/* Submission Awaiting Review Banner (for Admin/PM) */}
      {isAdminOrManager && task.status === 'SUBMITTED' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ color: '#b45309', fontSize: '1.05rem', display: 'block' }}>
                Pending Deliverable Review
              </strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Submitted by <strong>{task.submittedBy?.fullName || task.submittedBy?.username}</strong>
                {task.submittedAt && ` on ${new Date(task.submittedAt).toLocaleDateString()}`}
              </span>
              {task.submissionNotes && (
                <div style={{ marginTop: 8, fontStyle: 'italic', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #fde68a', fontSize: '0.88rem' }}>
                  "{task.submissionNotes}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleApprove}>
                ✓ Approve Deliverables
              </button>
              <button className="btn btn-danger" onClick={() => setShowRejectBox((p) => !p)}>
                ✕ Reject / Request Changes
              </button>
            </div>
          </div>

          {showRejectBox && (
            <form onSubmit={handleReject} style={{ marginTop: 14, borderTop: '1px solid #fde68a', paddingTop: 14 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b45309', display: 'block', marginBottom: 6 }}>
                Reason for Rejection & Required Adjustments:
              </label>
              <textarea
                className="form-control"
                rows="3"
                required
                placeholder="Explain what the member should correct..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowRejectBox(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-danger">
                  Confirm Rejection
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Main Grid: Details / Form & Deliverables */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        {/* Left Column: Task Overview & Specs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 14 }}>Task Specifications</h3>

            {isAdminOrManager ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={form.description || ''}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assigned Team / Group</label>
                    <select
                      className="form-control"
                      value={form.team || ''}
                      onChange={(e) => setForm({ ...form, team: e.target.value })}
                    >
                      <option value="">No Team Assigned</option>
                      {teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Individual Assignee</label>
                    <select
                      className="form-control"
                      value={form.assignedTo || ''}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.fullName || u.username}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      className="form-control"
                      value={form.priority || 'MEDIUM'}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.dueDate || ''}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }}>
                  Save Specifications
                </button>
              </form>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>DESCRIPTION:</strong>
                  <p style={{ marginTop: 4, fontSize: '0.92rem', lineHeight: 1.5 }}>
                    {task.description || 'No description provided for this task.'}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-subtle)', padding: 12, borderRadius: 8 }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Assigned Group</span>
                    <div style={{ fontWeight: 600 }}>{task.team?.name || 'Open to All'}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Deadline</span>
                    <div style={{ fontWeight: 600 }}>{task.dueDate || 'No deadline'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress Slider Card */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>Execution Progress</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Completion Percentage</span>
              <strong>{progressVal}%</strong>
            </div>

            <div className="progress-bar-container" style={{ height: 10, marginBottom: 12 }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${progressVal}%`,
                  background: progressVal === 100 ? '#16a34a' : 'var(--primary)',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={progressVal}
                onChange={(e) => handleProgressChange(e.target.value)}
                style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 700, minWidth: 40, textAlign: 'right' }}>{progressVal}%</span>
            </div>
          </div>
        </div>

        {/* Right Column: Deliverables & Submission */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Submit Deliverables Form (Members & Assignees) */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Submit Deliverables</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Upload your deliverables (PDF, code artifacts, screenshots, archives) and submit for Admin / PM sign-off.
            </p>

            <form onSubmit={handleSubmitDeliverables} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Implementation Remarks</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Summary of changes, test results, or links to external PRs..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Attached Documents</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                />
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                  Allowed: PDF, DOCX, ZIP, PNG, JPG, TXT (up to 15MB)
                </small>
              </div>

              {selectedFiles.length > 0 && (
                <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 6, fontSize: '0.82rem' }}>
                  <strong>Files to upload ({selectedFiles.length}):</strong>
                  <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                    {selectedFiles.map((f, idx) => (
                      <li key={idx}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmittingWork}
                style={{ marginTop: 6 }}
              >
                {isSubmittingWork ? 'Submitting Work...' : task.status === 'REJECTED' ? 'Resubmit Deliverables' : 'Submit for Completion ✓'}
              </button>
            </form>
          </div>

          {/* Attached Deliverables List */}
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Deliverables & Attachments ({attachments.length})
              </h3>

              <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                + Add File
                <input type="file" style={{ display: 'none' }} onChange={handleDirectFileUpload} />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                No files uploaded yet. Upload deliverables above to submit for sign-off.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>📄</span>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{att.fileName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {att.fileSize ? `${(att.fileSize / 1024).toFixed(1)} KB` : 'Document'}
                          {att.uploadedBy && ` • Uploaded by ${att.uploadedBy.username}`}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`http://localhost:8080${att.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-sm btn-secondary"
                      download
                    >
                      Download ⬇
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discussion & Comments */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>
              Team Discussion ({comments.length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', marginBottom: 14 }}>
              {comments.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} style={{ background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <strong>{c.user?.fullName || c.user?.username || 'Team Member'}</strong>
                      <span>{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', marginTop: 4 }}>{c.content}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Write a message or update..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;
