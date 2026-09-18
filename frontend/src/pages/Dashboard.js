import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTasks,
  getMyGroupTasks,
  createTask,
  updateTask,
  deleteTask,
  updateTaskProgress,
  submitTaskCompletion,
  approveTask,
  rejectTask,
  getTeams,
  getMyTeams,
  getProjects,
  getMyProjects,
  getSprints,
  getUsers,
} from '../services/api';
import useAuth from '../hooks/useAuth';

import teamHero from '../assets/team_collaboration.jpg';
import projectHero from '../assets/project_planning.jpg';
import deliverableHero from '../assets/task_deliverables.jpg';
import dashboardHero from '../assets/dashboard_hero.jpg';

const STATUS_CONFIG = {
  TODO: { label: 'To Do', badgeClass: 'badge badge-todo', color: '#64748b' },
  IN_PROGRESS: { label: 'In Progress', badgeClass: 'badge badge-inprogress', color: '#0284c7' },
  SUBMITTED: { label: 'Submitted', badgeClass: 'badge badge-submitted', color: '#b45309' },
  APPROVED: { label: 'Approved', badgeClass: 'badge badge-approved', color: '#16a34a' },
  REJECTED: { label: 'Rejected', badgeClass: 'badge badge-rejected', color: '#e11d48' },
  DONE: { label: 'Completed', badgeClass: 'badge badge-done', color: '#16a34a' },
};

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', badgeClass: 'badge badge-low' },
  MEDIUM: { label: 'Medium', badgeClass: 'badge badge-medium' },
  HIGH: { label: 'High', badgeClass: 'badge badge-high' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: '',
  sprint: '',
  team: '',
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
  const isAdminOrManager = role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

  const [tasks, setTasks] = useState([]);
  const [teams, setTeams] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [memberStatusTab, setMemberStatusTab] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [submitModalTask, setSubmitModalTask] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rejectModalTask, setRejectModalTask] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  const showAlert = (msg, type = 'success') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 3500);
  };

  const loadData = useCallback(() => {
    if (!user?.id) return;
    setLoading(true);

    const taskReq = isAdminOrManager ? getTasks() : getMyGroupTasks();
    const teamReq = isAdminOrManager ? getTeams() : getMyTeams();
    const projReq = isAdminOrManager ? getProjects() : getMyProjects();

    Promise.all([
      taskReq.then((r) => r.data).catch(() => []),
      teamReq.then((r) => r.data).catch(() => []),
      projReq.then((r) => r.data).catch(() => []),
      getSprints().then((r) => r.data).catch(() => []),
      isAdminOrManager ? getUsers().then((r) => r.data).catch(() => []) : Promise.resolve([]),
    ])
      .then(([tData, tmData, prData, spData, uData]) => {
        setTasks(tData);
        setTeams(tmData);
        setProjects(prData);
        setSprints(spData);
        setUsers(uData);
      })
      .catch(() => showAlert('Failed to load workspace data', 'error'))
      .finally(() => setLoading(false));
  }, [user, isAdminOrManager]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Create task (Admin / PM)
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        team: form.team ? { id: Number(form.team) } : null,
        sprint: form.sprint ? { id: Number(form.sprint) } : null,
        assignedTo: form.assignedTo ? { id: Number(form.assignedTo) } : null,
      };
      await createTask(payload);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      showAlert('Task created and assigned successfully!');
      loadData();
    } catch {
      showAlert('Failed to create task', 'error');
    }
  };

  // Quick move status (e.g. Start Task)
  const handleMoveStatus = async (e, task, newStatus) => {
    e.stopPropagation();
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        dueDate: task.dueDate || null,
        team: task.team ? { id: task.team.id } : null,
      });
      showAlert(`Task moved to ${newStatus.replace('_', ' ')}.`);
      loadData();
    } catch {
      showAlert('Failed to update status', 'error');
    }
  };

  // Progress update slider
  const handleProgressChange = async (e, taskId, newProgress) => {
    e.stopPropagation();
    try {
      await updateTaskProgress(taskId, Number(newProgress));
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, progress: Number(newProgress) } : t))
      );
    } catch {
      showAlert('Failed to update progress', 'error');
    }
  };

  // Document Submission by Member
  const handleOpenSubmitModal = (e, task) => {
    e.stopPropagation();
    setSubmitModalTask(task);
    setSubmissionNotes('');
    setSubmissionFiles([]);
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    if (!submitModalTask) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (submissionNotes.trim()) {
        formData.append('notes', submissionNotes);
      }
      for (let i = 0; i < submissionFiles.length; i++) {
        formData.append('files', submissionFiles[i]);
      }

      await submitTaskCompletion(submitModalTask.id, formData);
      showAlert('Task submitted for review with documents!');
      setSubmitModalTask(null);
      loadData();
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Failed to submit task documents', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve submission (Admin/PM)
  const handleApprove = async (e, taskId) => {
    e.stopPropagation();
    try {
      await approveTask(taskId);
      showAlert('Task submission approved successfully! ✓');
      loadData();
    } catch {
      showAlert('Failed to approve task', 'error');
    }
  };

  // Reject submission (Admin/PM)
  const handleOpenReject = (e, task) => {
    e.stopPropagation();
    setRejectModalTask(task);
    setRejectionReasonInput('');
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectModalTask) return;
    try {
      await rejectTask(rejectModalTask.id, rejectionReasonInput);
      showAlert('Task returned with feedback reason.');
      setRejectModalTask(null);
      loadData();
    } catch {
      showAlert('Failed to reject task', 'error');
    }
  };

  // Delete task
  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      showAlert('Task deleted successfully.');
      loadData();
    } catch {
      showAlert('Failed to delete task', 'error');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchSearch =
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.team?.name?.toLowerCase().includes(search.toLowerCase());
    const matchPriority = !filterPriority || t.priority === filterPriority;
    const matchTeam = !filterTeam || String(t.team?.id) === String(filterTeam);
    const matchStatusTab =
      memberStatusTab === 'ALL' ||
      (memberStatusTab === 'TODO' && t.status === 'TODO') ||
      (memberStatusTab === 'IN_PROGRESS' && t.status === 'IN_PROGRESS') ||
      (memberStatusTab === 'SUBMITTED' && t.status === 'SUBMITTED') ||
      (memberStatusTab === 'APPROVED' && (t.status === 'APPROVED' || t.status === 'DONE')) ||
      (memberStatusTab === 'REJECTED' && t.status === 'REJECTED');

    return matchSearch && matchPriority && matchTeam && matchStatusTab;
  });

  const pendingSubmissions = tasks.filter((t) => t.status === 'SUBMITTED');
  const approvedTasks = tasks.filter((t) => t.status === 'APPROVED' || t.status === 'DONE');

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Alert toast */}
      {alert && (
        <div className={`alert alert-${alert.type === 'error' ? 'error' : 'success'}`}>
          <span>{alert.msg}</span>
        </div>
      )}

      {/* Rich Page Hero Banner Card with Integrated Artwork */}
      <div className="hero-welcome-card">
        <div className="hero-welcome-content">
          <div className="hero-welcome-badge">
            <span style={{ fontSize: '0.9rem' }}>{isAdminOrManager ? '🛡️ SPRINT ORCHESTRATION' : '⚡ SQUAD WORKSPACE'}</span>
            <span>•</span>
            <span>{isAdminOrManager ? 'Management & Review' : 'Active Contributor'}</span>
          </div>

          <h1 className="hero-welcome-title">
            {isAdminOrManager
              ? 'Empower Your Engineering Squads'
              : `Welcome Back, ${user?.fullName || user?.username || 'Team Member'}!`}
          </h1>

          <p className="hero-welcome-desc">
            {isAdminOrManager
              ? 'Delegate group tasks across specialized squads, monitor sprint velocity, and approve submitted technical deliverables.'
              : `You are actively enrolled in ${teams.length} squad${teams.length === 1 ? '' : 's'} across ${projects.length} project${projects.length === 1 ? '' : 's'}. Track your assigned group tasks and upload verification documents.`}
          </p>

          <div className="hero-welcome-actions">
            {isAdminOrManager && (
              <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create Group Task
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/teams')}
              style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              View Squads ({teams.length})
            </button>
            <button
              className="btn btn-secondary"
              onClick={loadData}
              style={{ background: 'rgba(255,255,255,0.12)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.25)' }}
              title="Sync latest workspace state"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Sync
            </button>
          </div>
        </div>

        <div className="hero-welcome-artwork-wrapper">
          <img
            src={isAdminOrManager ? projectHero : teamHero}
            alt="Workspace Illustration"
            className="hero-welcome-artwork"
          />
        </div>
      </div>

      {/* High-level KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{teams.length}</div>
          <div className="stat-label">{isAdminOrManager ? 'Active Squads' : 'My Teams'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{projects.length}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card" style={{ borderColor: pendingSubmissions.length > 0 ? '#fde68a' : undefined }}>
          <div className="stat-value" style={{ color: pendingSubmissions.length > 0 ? '#b45309' : undefined }}>
            {pendingSubmissions.length}
          </div>
          <div className="stat-label">{isAdminOrManager ? 'Pending Review' : 'My Submissions'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{approvedTasks.length}</div>
          <div className="stat-label">Approved Deliverables</div>
        </div>
      </div>

      {/* TEAM MEMBER: My Teams & Projects Strip */}
      {!isAdminOrManager && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* My Teams Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>👥 My Squads</span>
                <span className="badge badge-member">{teams.length}</span>
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => navigate('/teams')}
              >
                All Teams →
              </button>
            </div>
            {teams.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>You have not been assigned to any teams yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teams.map((tm) => (
                  <div key={tm.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text)' }}>{tm.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tm.description || 'Active squad'}</div>
                    </div>
                    <span className="badge badge-member">{tm.members ? `${tm.members.length} members` : 'Squad'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Projects Card */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🚀 Assigned Projects</span>
                <span className="badge badge-inprogress">{projects.length}</span>
              </h3>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                onClick={() => navigate('/projects')}
              >
                View All →
              </button>
            </div>
            {projects.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>No projects linked to your teams yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projects.map((p) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.94rem', color: 'var(--text)' }}>{p.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Deadline: {p.endDate || 'Ongoing'}
                      </div>
                    </div>
                    <span className="badge badge-inprogress">{p.status || 'ACTIVE'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN & PM: Pending Review Alert Banner with Deliverable Artwork */}
      {isAdminOrManager && pendingSubmissions.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 16, padding: 22, boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src={deliverableHero}
                alt="Deliverable Verification"
                style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid #fde68a' }}
              />
              <div>
                <strong style={{ color: '#b45309', fontSize: '1.05rem', display: 'block' }}>
                  {pendingSubmissions.length} Deliverable Submission{pendingSubmissions.length > 1 ? 's' : ''} Awaiting Review
                </strong>
                <span style={{ fontSize: '0.82rem', color: '#92400e' }}>
                  Verify attached technical documents, provide feedback, or approve completion.
                </span>
              </div>
            </div>
            <span className="badge" style={{ background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
              Action Required
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {pendingSubmissions.map((st) => (
              <div key={st.id} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{st.title}</strong>
                  <span className="badge badge-submitted">Submitted</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Team: <strong>{st.team?.name || 'Assigned Group'}</strong>
                  {st.submittedBy && <span> • By: <strong>{st.submittedBy.username}</strong></span>}
                </div>
                {st.submissionNotes && (
                  <div style={{ fontSize: '0.82rem', fontStyle: 'italic', background: 'var(--bg-subtle)', padding: '6px 8px', borderRadius: 4, marginTop: 8 }}>
                    "{st.submissionNotes}"
                  </div>
                )}
                {st.attachments && st.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {st.attachments.map((att) => (
                      <a
                        key={att.id}
                        href={`http://localhost:8080${att.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="file-pill"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        📎 {att.fileName}
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-sm btn-primary" onClick={(e) => handleApprove(e, st.id)}>
                    ✓ Approve
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={(e) => handleOpenReject(e, st)}>
                    ✕ Reject
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/tasks/${st.id}`)}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search tasks by title, description, team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Team Filter */}
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 160 }}
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="">All Teams / Groups</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>{tm.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: 140 }}
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>

        {/* Member Category Status Tabs */}
        {!isAdminOrManager && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {[
              { key: 'ALL', label: 'All Tasks' },
              { key: 'TODO', label: 'Pending (To Do)' },
              { key: 'IN_PROGRESS', label: 'In Progress' },
              { key: 'SUBMITTED', label: 'Submitted' },
              { key: 'APPROVED', label: 'Approved ✓' },
              { key: 'REJECTED', label: 'Needs Revision' },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn btn-sm ${memberStatusTab === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setMemberStatusTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Task Content: Board / Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          Loading tasks and workspace information...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No tasks found matching current filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filteredTasks.map((t) => {
            const stConfig = STATUS_CONFIG[t.status] || STATUS_CONFIG.TODO;
            const prConfig = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
            const progressVal = t.progress || 0;

            return (
              <div
                key={t.id}
                className="card"
                style={{
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  cursor: 'pointer',
                  borderLeft: `4px solid ${stConfig.color}`,
                }}
                onClick={() => navigate(`/tasks/${t.id}`)}
              >
                {/* Header: Title & Priority */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3 }}>{t.title}</h3>
                  <span className={prConfig.badgeClass}>{prConfig.label}</span>
                </div>

                {/* Team & Sprint tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {t.team && (
                    <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>
                      👥 {t.team.name}
                    </span>
                  )}
                  {t.assignedTo && (
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-subtle)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 4 }}>
                      👤 {t.assignedTo.fullName || t.assignedTo.username}
                    </span>
                  )}
                  {t.dueDate && (
                    <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 500 }}>
                      📅 Due: {t.dueDate}
                    </span>
                  )}
                </div>

                {/* Description snippet */}
                {t.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.description}
                  </p>
                )}

                {/* Rejection Alert Banner */}
                {t.status === 'REJECTED' && (
                  <div className="rejection-banner" style={{ margin: 0, padding: 10 }}>
                    <div style={{ fontWeight: 600, color: '#e11d48', fontSize: '0.82rem' }}>Needs Revision:</div>
                    <div style={{ fontSize: '0.8rem', color: '#9f1239', marginTop: 2 }}>{t.rejectionReason}</div>
                  </div>
                )}

                {/* Progress bar and slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Completion Progress</span>
                    <strong>{progressVal}%</strong>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${progressVal}%`,
                        background: progressVal === 100 ? '#16a34a' : 'var(--primary)',
                      }}
                    />
                  </div>

                  {/* Interactive slider for Members / Assignees */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={progressVal}
                      onChange={(e) => handleProgressChange(e, t.id, e.target.value)}
                      style={{ flex: 1, accentColor: 'var(--primary)', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* Attachments preview */}
                {t.attachments && t.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {t.attachments.slice(0, 2).map((att) => (
                      <span key={att.id} className="file-pill" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                        📎 {att.fileName}
                      </span>
                    ))}
                    {t.attachments.length > 2 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{t.attachments.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 'auto' }}>
                  <span className={stConfig.badgeClass}>{stConfig.label}</span>

                  <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                    {/* Quick status moves */}
                    {t.status === 'TODO' && (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => handleMoveStatus(e, t, 'IN_PROGRESS')}
                        title="Move to In Progress"
                      >
                        Start →
                      </button>
                    )}

                    {/* Submit Completion button (for Members / Assignees) */}
                    {(t.status === 'TODO' || t.status === 'IN_PROGRESS' || t.status === 'REJECTED') && (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={(e) => handleOpenSubmitModal(e, t)}
                        title="Upload deliverables and submit for approval"
                      >
                        {t.status === 'REJECTED' ? 'Resubmit' : 'Submit ✓'}
                      </button>
                    )}

                    {/* Admin / PM Review actions */}
                    {isAdminOrManager && t.status === 'SUBMITTED' && (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={(e) => handleApprove(e, t.id)}
                          title="Approve"
                        >
                          ✓
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => handleOpenReject(e, t)}
                          title="Reject"
                        >
                          ✕
                        </button>
                      </>
                    )}

                    {/* Delete (Admin/PM only) */}
                    {isAdminOrManager && (
                      <button
                        className="btn-icon"
                        onClick={(e) => handleDeleteTask(e, t.id)}
                        title="Delete Task"
                        style={{ color: 'var(--danger)' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Create Task */}
      {showCreate && (
        <Modal title="Create & Assign New Task" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Implement Role-Based Access Control"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Detailed task requirements and acceptance criteria..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Assigned Team / Group *</label>
                <select
                  className="form-control"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                >
                  <option value="">Select Team / Group</option>
                  {teams.map((tm) => (
                    <option key={tm.id} value={tm.id}>{tm.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Individual Assignee (Optional)</label>
                <select
                  className="form-control"
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                >
                  <option value="">Unassigned (Entire Group)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <div className="priority-chips-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div
                  className={`priority-chip-option ${form.priority === 'LOW' ? 'selected-low' : ''}`}
                  onClick={() => setForm({ ...form, priority: 'LOW' })}
                >
                  🟢 Low
                </div>
                <div
                  className={`priority-chip-option ${form.priority === 'MEDIUM' ? 'selected-medium' : ''}`}
                  onClick={() => setForm({ ...form, priority: 'MEDIUM' })}
                >
                  🟡 Medium
                </div>
                <div
                  className={`priority-chip-option ${form.priority === 'HIGH' ? 'selected-high' : ''}`}
                  onClick={() => setForm({ ...form, priority: 'HIGH' })}
                >
                  🔴 High
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sprint Association (Optional)</label>
                <select
                  className="form-control"
                  value={form.sprint}
                  onChange={(e) => setForm({ ...form, sprint: e.target.value })}
                >
                  <option value="">Backlog (No Sprint)</option>
                  {sprints.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create & Assign Task
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Submit Task for Completion with Documents */}
      {submitModalTask && (
        <Modal title={`Submit Deliverables: ${submitModalTask.title}`} onClose={() => setSubmitModalTask(null)}>
          <form onSubmit={handleDocumentSubmit}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
              Upload your task documents (PDF, DOCX, ZIP, images, etc.) and add submission notes. The task will be routed to your Project Manager and Admin for review.
            </p>

            <div className="form-group">
              <label>Submission Notes & Implementation Summary</label>
              <textarea
                className="form-control"
                rows="3"
                placeholder="Explain what was accomplished or links to PRs / artifacts..."
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Upload Documents / Deliverables</label>
              <input
                type="file"
                multiple
                className="form-control"
                onChange={(e) => setSubmissionFiles(Array.from(e.target.files))}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: 4 }}>
                Supported formats: PDF, DOC, DOCX, XLS, PPT, ZIP, Images, TXT (up to 15MB).
              </small>
            </div>

            {submissionFiles.length > 0 && (
              <div style={{ background: 'var(--bg-subtle)', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <strong style={{ fontSize: '0.85rem' }}>Selected Files ({submissionFiles.length}):</strong>
                <ul style={{ paddingLeft: 18, marginTop: 4, fontSize: '0.82rem' }}>
                  {submissionFiles.map((f, i) => (
                    <li key={i}>{f.name} ({(f.size / 1024).toFixed(1)} KB)</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setSubmitModalTask(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Uploading & Submitting...' : 'Submit for Completion'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Reject Task with Reason */}
      {rejectModalTask && (
        <Modal title={`Reject Submission: ${rejectModalTask.title}`} onClose={() => setRejectModalTask(null)}>
          <form onSubmit={handleConfirmReject}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 14 }}>
              Provide clear feedback explaining why this submission is rejected so the team member can correct it and resubmit.
            </p>

            <div className="form-group">
              <label>Rejection Reason / Required Changes *</label>
              <textarea
                className="form-control"
                rows="4"
                required
                placeholder="e.g. Please include test coverage reports and update the API documentation..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setRejectModalTask(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-danger">
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;
