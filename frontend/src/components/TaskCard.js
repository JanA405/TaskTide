import { useNavigate } from 'react-router-dom';

const PRIORITY_BADGE = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_BADGE = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', DONE: 'badge-done' };

function TaskCard({ task }) {
  const navigate = useNavigate();
  return (
    <div className="task-card" onClick={() => navigate(`/tasks/${task.id}`)}>
      <h4>{task.title}</h4>
      {task.description && <p>{task.description}</p>}
      <div className="task-card-footer">
        <span className={`badge ${STATUS_BADGE[task.status] || 'badge-todo'}`}>{task.status}</span>
        {task.priority && <span className={`badge ${PRIORITY_BADGE[task.priority] || ''}`}>{task.priority}</span>}
        {task.dueDate && <small style={{ color: 'var(--text-muted)', fontSize: '.72rem' }}>📅 {task.dueDate}</small>}
      </div>
    </div>
  );
}

export default TaskCard;
