import type { Task } from '../types';
import { TaskCard } from './TaskCard';

const priorityWeight: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TaskList({
  tasks,
  isLoading,
  selectedTaskId,
  onSelectTask,
}: {
  tasks: Task[];
  isLoading: boolean;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}) {
  const sortedTasks = [...tasks].sort((left, right) => {
    const byPriority = priorityWeight[left.priority] - priorityWeight[right.priority];
    if (byPriority !== 0) {
      return byPriority;
    }
    return right.created_at.localeCompare(left.created_at);
  });

  if (isLoading) {
    return <div className="task-list-empty">Loading tasks…</div>;
  }

  if (sortedTasks.length === 0) {
    return <div className="task-list-empty">No tasks for this filter.</div>;
  }

  return (
    <div className="task-list">
      {sortedTasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onSelect={() => onSelectTask(task.id)}
        />
      ))}
    </div>
  );
}
