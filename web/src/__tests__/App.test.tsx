import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from '../App';
import type { Task, TaskAggregate } from '../types';

const api = vi.hoisted(() => ({
  createTask: vi.fn(),
  getTaskAggregate: vi.fn(),
  listTasks: vi.fn(),
  markDone: vi.fn(),
  updateTask: vi.fn(),
}));

vi.mock('../api', () => api);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_1',
    title: 'Existing task',
    summary: 'A task in the list',
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

function makeAggregate(overrides: Partial<TaskAggregate> = {}): TaskAggregate {
  return {
    id: 'task_1',
    title: 'Existing task',
    summary: 'A task in the list',
    status: 'todo',
    priority: 'medium',
    acceptance_criteria: '',
    dependencies: [],
    references: [],
    tags: [],
    recent_logs: [],
    notes: '',
    markdown_file: '/tmp/task_1.md',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders filter tabs', async () => {
    api.listTasks.mockResolvedValue([makeTask()]);
    api.getTaskAggregate.mockResolvedValue(makeAggregate());

    render(<App />);

    expect(screen.getByRole('tablist', { name: 'Task status filters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Todo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'In Progress' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Blocked' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelled' })).toBeInTheDocument();

    await waitFor(() => expect(api.listTasks).toHaveBeenCalled());
  });

  test('shows empty state when listTasks resolves an empty array', async () => {
    api.listTasks.mockResolvedValue([]);
    api.getTaskAggregate.mockResolvedValue(makeAggregate());

    render(<App />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'No task selected' })).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Create a task or choose one from the list to inspect its details.'),
    ).toBeInTheDocument();
    expect(screen.getByText('No tasks for this filter.')).toBeInTheDocument();
  });
});
