import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { CreateTaskForm } from '../components/CreateTaskForm';

describe('CreateTaskForm', () => {
  test('renders title, summary, priority, criteria, and notes fields', () => {
    render(<CreateTaskForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Summary')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Acceptance Criteria')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  test('submit is disabled when title is empty', () => {
    render(<CreateTaskForm onSubmit={vi.fn()} isSubmitting={false} />);

    expect(screen.getByRole('button', { name: 'Create Task' })).toBeDisabled();
    expect(screen.getByLabelText('Title')).toBeInvalid();
  });

  test('calls onSubmit with the entered data and resets after submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CreateTaskForm onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText('Title'), 'Draft release notes');
    await user.type(screen.getByLabelText('Summary'), 'Summarize changes');
    await user.selectOptions(screen.getByLabelText('Priority'), 'urgent');
    await user.type(screen.getByLabelText('Acceptance Criteria'), 'Approved by team');
    await user.type(screen.getByLabelText('Notes'), 'Include screenshots');
    await user.click(screen.getByRole('button', { name: 'Create Task' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Draft release notes',
        summary: 'Summarize changes',
        priority: 'urgent',
        acceptance_criteria: 'Approved by team',
        tags: [],
        notes: 'Include screenshots',
      }),
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Title')).toHaveValue('');
      expect(screen.getByLabelText('Summary')).toHaveValue('');
      expect(screen.getByLabelText('Priority')).toHaveValue('medium');
      expect(screen.getByLabelText('Acceptance Criteria')).toHaveValue('');
      expect(screen.getByLabelText('Tags')).toHaveValue('');
      expect(screen.getByLabelText('Notes')).toHaveValue('');
    });
  });
});
