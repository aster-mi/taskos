import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { HistoryEvent } from '../types';

const api = vi.hoisted(() => ({
  listHistory: vi.fn(),
}));

vi.mock('../api', () => api);

describe('HistoryView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows "No history yet." when empty', async () => {
    api.listHistory.mockResolvedValue([]);

    const { HistoryView } = await import('../components/HistoryView');
    render(<HistoryView />);

    await waitFor(() => expect(screen.getByText('No history yet.')).toBeInTheDocument());
  });

  test('shows history events', async () => {
    const events: HistoryEvent[] = [
      {
        id: 'evt_1',
        task_id: 'task_1',
        task_title: 'My important task',
        status_from: 'todo',
        status_to: 'in-progress',
        changed_at: '2026-04-01T10:00:00.000Z',
      },
    ];
    api.listHistory.mockResolvedValue(events);

    const { HistoryView } = await import('../components/HistoryView');
    render(<HistoryView />);

    await waitFor(() => expect(screen.getByText('My important task')).toBeInTheDocument());
    expect(screen.getByText('todo')).toBeInTheDocument();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
  });
});
