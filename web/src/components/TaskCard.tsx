import type { Task } from '../types';

const priorityLabels: Record<Task['priority'], string> = {
  urgent: 'priority-urgent',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export function TaskCard({
  task,
  isSelected,
  onSelect,
}: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button className={isSelected ? 'task-card selected' : 'task-card'} onClick={onSelect}>
      <div className="task-card-top">
        <span className={`priority-badge ${priorityLabels[task.priority]}`}>{task.priority}</span>
        <span className={`status-badge status-${task.status}`}>{task.status}</span>
      </div>
      <strong>{task.title}</strong>
      <p>{task.summary || 'No summary yet.'}</p>
    </button>
  );
}
