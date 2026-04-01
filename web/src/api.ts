import type { CreateTaskInput, HistoryEvent, Task, TaskAggregate, TaskPriority, TaskStatus } from './types';

type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
};

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ error: 'Request failed' }))) as {
      error?: string;
    };
    throw new Error(error.error ?? 'Request failed');
  }

  return (await response.json()) as T;
}

export function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set('status', filters.status);
  }
  if (filters.priority) {
    params.set('priority', filters.priority);
  }
  if (filters.tag) {
    params.set('tag', filters.tag);
  }
  const query = params.toString();
  return request<Task[]>(`/api/tasks${query ? `?${query}` : ''}`);
}

export function getTask(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`);
}

export function getTaskAggregate(id: string): Promise<TaskAggregate> {
  return request<TaskAggregate>(`/api/tasks/${id}/aggregate`);
}

export function createTask(data: CreateTaskInput): Promise<Task> {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateTask(id: string, data: Partial<Task>): Promise<Task> {
  return request<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function markDone(id: string): Promise<Task> {
  return request<Task>(`/api/tasks/${id}/done`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function listHistory(filters: { since?: string; status?: string } = {}): Promise<HistoryEvent[]> {
  const params = new URLSearchParams();
  if (filters.since) {
    params.set('since', filters.since);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  const query = params.toString();
  return request<HistoryEvent[]>(`/api/history${query ? `?${query}` : ''}`);
}
