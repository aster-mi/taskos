import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { KanbanBoard } from '../components/KanbanBoard';
import type { Task } from '../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_1',
    title: 'Test task',
    summary: 'A test task',
    status: 'todo',
    priority: 'medium',
    dependencies: [],
    references: [],
    tags: [],
    acceptance_criteria: '',
    notes: '',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('KanbanBoard', () => {
  test('renders correct column headers', () => {
    render(<KanbanBoard tasks={[]} selectedTaskId={null} onSelectTask={() => {}} />);

    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Blocked')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  test('tasks appear in the correct column', () => {
    const tasks = [
      makeTask({ id: 'task_1', title: 'Todo task', status: 'todo' }),
      makeTask({ id: 'task_2', title: 'In-progress task', status: 'in-progress' }),
      makeTask({ id: 'task_3', title: 'Done task', status: 'done' }),
    ];

    render(<KanbanBoard tasks={tasks} selectedTaskId={null} onSelectTask={() => {}} />);

    expect(screen.getByText('Todo task')).toBeInTheDocument();
    expect(screen.getByText('In-progress task')).toBeInTheDocument();
    expect(screen.getByText('Done task')).toBeInTheDocument();
  });

  test('clicking a card calls onSelectTask with the task id', async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();
    const tasks = [makeTask({ id: 'task_42', title: 'Clickable task', status: 'todo' })];

    render(<KanbanBoard tasks={tasks} selectedTaskId={null} onSelectTask={onSelectTask} />);

    await user.click(screen.getByRole('button', { name: /clickable task/i }));

    expect(onSelectTask).toHaveBeenCalledWith('task_42');
  });
});
