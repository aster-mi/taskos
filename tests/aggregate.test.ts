import { describe, expect, it } from 'vitest';
import { buildAggregate } from '../src/aggregate/index.js';
import type { Task, TaskLog } from '../src/models/task.js';

describe('buildAggregate', () => {
  it('builds the expected AI aggregate shape', () => {
    const task: Task = {
      id: 'abc12345',
      title: 'Review code',
      summary: 'Check the diff',
      status: 'in-progress',
      priority: 'high',
      dependencies: ['dep1'],
      references: ['src/index.ts'],
      tags: [],
      acceptance_criteria: 'Diff reviewed',
      notes: 'Focus on regressions',
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T01:00:00.000Z',
    };
    const logs: TaskLog[] = [
      {
        id: 'log1',
        task_id: 'abc12345',
        message: 'Opened diff',
        filepath: 'src/index.ts',
        created_at: '2026-04-01T00:30:00.000Z',
      },
      {
        id: 'log2',
        task_id: 'abc12345',
        message: 'Left comments',
        filepath: null,
        created_at: '2026-04-01T00:45:00.000Z',
      },
    ];

    expect(buildAggregate(task, logs, '.taskos/tasks')).toEqual({
      id: 'abc12345',
      title: 'Review code',
      summary: 'Check the diff',
      status: 'in-progress',
      priority: 'high',
      acceptance_criteria: 'Diff reviewed',
      dependencies: ['dep1'],
      references: ['src/index.ts'],
      recent_logs: [
        {
          message: 'Opened diff',
          filepath: 'src/index.ts',
          created_at: '2026-04-01T00:30:00.000Z',
        },
        {
          message: 'Left comments',
          created_at: '2026-04-01T00:45:00.000Z',
        },
      ],
      notes: 'Focus on regressions',
      markdown_file: '.taskos/tasks/abc12345.md',
      created_at: '2026-04-01T00:00:00.000Z',
      updated_at: '2026-04-01T01:00:00.000Z',
    });
  });
});
