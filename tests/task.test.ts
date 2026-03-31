import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { createSchema } from '../src/db/schema.js';
import {
  addTaskLog,
  createTask,
  deleteTask,
  getTask,
  getTaskLogs,
  listTasks,
  updateTask,
} from '../src/models/task.js';

function makeDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  createSchema(db);
  return db;
}

describe('task model', () => {
  it('creates and fetches a task', () => {
    const db = makeDb();
    const task = createTask(db, {
      title: 'Write tests',
      summary: 'Cover CRUD',
      dependencies: ['abc123'],
      references: ['src/models/task.ts'],
    });

    const fetched = getTask(db, task.id);
    expect(fetched).toMatchObject({
      id: task.id,
      title: 'Write tests',
      dependencies: ['abc123'],
      references: ['src/models/task.ts'],
    });
  });

  it('lists and filters tasks', () => {
    const db = makeDb();
    createTask(db, { title: 'A', status: 'todo', priority: 'low' });
    createTask(db, { title: 'B', status: 'done', priority: 'high' });

    expect(listTasks(db)).toHaveLength(2);
    expect(listTasks(db, { status: 'done' })).toHaveLength(1);
    expect(listTasks(db, { priority: 'low' })[0]?.title).toBe('A');
  });

  it('updates and deletes a task', () => {
    const db = makeDb();
    const task = createTask(db, { title: 'Initial' });

    const updated = updateTask(db, task.id, {
      title: 'Updated',
      status: 'in-progress',
      notes: 'Working on it',
    });

    expect(updated.title).toBe('Updated');
    expect(updated.status).toBe('in-progress');
    expect(getTask(db, task.id)?.notes).toBe('Working on it');

    deleteTask(db, task.id);
    expect(getTask(db, task.id)).toBeNull();
  });

  it('stores logs for a task', () => {
    const db = makeDb();
    const task = createTask(db, { title: 'Track links' });

    addTaskLog(db, task.id, 'Added a file', 'src/file.ts');
    addTaskLog(db, task.id, 'Updated status');

    const logs = getTaskLogs(db, task.id);
    expect(logs).toHaveLength(2);
    expect(logs[0]?.message).toBe('Updated status');
    expect(logs[1]?.filepath).toBe('src/file.ts');
  });
});
