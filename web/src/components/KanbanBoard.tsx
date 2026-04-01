import type { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

const COLUMNS: Array<{ status: TaskStatus; label: string }> = [
  { status: 'todo', label: 'Todo' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'done', label: 'Done' },
  { status: 'cancelled', label: 'Cancelled' },
];

export function KanbanBoard({
  tasks,
  selectedTaskId,
  onSelectTask,
}: {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}) {
  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);
        return (
          <div key={col.status} className="kanban-column">
            <div className="kanban-column-header">{col.label}</div>
            <div className="kanban-cards">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={task.id === selectedTaskId}
                  onSelect={() => onSelectTask(task.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
