import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { TaskCard } from '../components/TaskCard';
import type { Task } from '../types';

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task_1',
    title: 'Ship UI tests',
    summary: 'Add coverage for task cards',
    status: 'in-progress',
    priority: 'high',
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

describe('TaskCard', () => {
  test('renders title, status badge, and priority badge', () => {
    render(<TaskCard task={makeTask()} isSelected={false} onSelect={() => {}} />);

    expect(screen.getByText('Ship UI tests')).toBeInTheDocument();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<TaskCard task={makeTask()} isSelected={false} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /ship ui tests/i }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('renders tag badges when tags are present', () => {
    render(
      <TaskCard
        task={makeTask({ tags: ['feature', 'frontend'] })}
        isSelected={false}
        onSelect={() => {}}
      />,
    );

    expect(screen.getByText('feature')).toBeInTheDocument();
    expect(screen.getByText('frontend')).toBeInTheDocument();
  });

  test('does not render tag list when tags is empty', () => {
    const { container } = render(
      <TaskCard task={makeTask({ tags: [] })} isSelected={false} onSelect={() => {}} />,
    );

    expect(container.querySelector('.tag-list')).toBeNull();
  });
});
