import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { TaskDetail } from '../components/TaskDetail';
import type { TaskAggregate } from '../types';

const api = vi.hoisted(() => ({
  updateTask: vi.fn(),
  markDone: vi.fn(),
}));

vi.mock('../api', () => api);

function makeAggregate(overrides: Partial<TaskAggregate> = {}): TaskAggregate {
  return {
    id: 'task_1',
    title: 'Ship dashboard',
    summary: 'Implement the dashboard view',
    status: 'todo',
    priority: 'high',
    acceptance_criteria: 'Users can open it',
    dependencies: ['task_0'],
    references: ['src/dashboard.tsx'],
    recent_logs: [
      {
        message: 'Added dashboard shell',
        filepath: 'src/dashboard.tsx',
        created_at: '2026-04-01T01:00:00.000Z',
      },
    ],
    notes: 'Need final QA',
    markdown_file: '/tmp/task_1.md',
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T02:00:00.000Z',
    ...overrides,
  };
}

describe('TaskDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders task fields', () => {
    render(
      <TaskDetail
        task={makeAggregate()}
        isLoading={false}
        onStart={() => api.updateTask('task_1', { status: 'in-progress' })}
        onDone={() => api.markDone('task_1')}
        onBlock={() => api.updateTask('task_1', { status: 'blocked' })}
      />,
    );

    expect(screen.getByText('Ship dashboard')).toBeInTheDocument();
    expect(screen.getByText('Implement the dashboard view')).toBeInTheDocument();
    expect(screen.getByText('Users can open it')).toBeInTheDocument();
    expect(screen.getByText('task_0')).toBeInTheDocument();
    expect(screen.getByText('Need final QA')).toBeInTheDocument();
  });

  test('Start, Done, and Block buttons call updateTask or markDone', async () => {
    const user = userEvent.setup();

    render(
      <TaskDetail
        task={makeAggregate()}
        isLoading={false}
        onStart={() => api.updateTask('task_1', { status: 'in-progress' })}
        onDone={() => api.markDone('task_1')}
        onBlock={() => api.updateTask('task_1', { status: 'blocked' })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await user.click(screen.getByRole('button', { name: 'Block' }));

    expect(api.updateTask).toHaveBeenCalledWith('task_1', { status: 'in-progress' });
    expect(api.markDone).toHaveBeenCalledWith('task_1');
    expect(api.updateTask).toHaveBeenCalledWith('task_1', { status: 'blocked' });
  });

  test('shows references and recent_logs', () => {
    render(
      <TaskDetail
        task={makeAggregate()}
        isLoading={false}
        onStart={() => api.updateTask('task_1', { status: 'in-progress' })}
        onDone={() => api.markDone('task_1')}
        onBlock={() => api.updateTask('task_1', { status: 'blocked' })}
      />,
    );

    expect(screen.getAllByText('src/dashboard.tsx')[0]).toBeInTheDocument();
    expect(screen.getByText('Added dashboard shell')).toBeInTheDocument();
  });
});
