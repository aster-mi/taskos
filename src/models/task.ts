import type { DatabaseSync } from 'node:sqlite';
import { customAlphabet } from 'nanoid';

const makeId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export type TaskStatus = 'todo' | 'in-progress' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  references: string[];
  acceptance_criteria: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface TaskLog {
  id: string;
  task_id: string;
  message: string;
  filepath: string | null;
  created_at: string;
}

type TaskRow = {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string;
  refs: string;
  acceptance_criteria: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

type TaskLogRow = TaskLog;

type CreateTaskInput = Pick<Task, 'title'> &
  Partial<Omit<Task, 'id' | 'title' | 'created_at' | 'updated_at'>>;

function parseJsonArray(value: string): string[] {
  const parsed: unknown = JSON.parse(value);
  return Array.isArray(parsed) ? (parsed as string[]) : [];
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    status: row.status,
    priority: row.priority,
    dependencies: parseJsonArray(row.dependencies),
    references: parseJsonArray(row.refs),
    acceptance_criteria: row.acceptance_criteria,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function createTask(db: DatabaseSync, data: CreateTaskInput): Task {
  const now = new Date().toISOString();
  const task: Task = {
    id: makeId(),
    title: data.title,
    summary: data.summary ?? '',
    status: data.status ?? 'todo',
    priority: data.priority ?? 'medium',
    dependencies: data.dependencies ?? [],
    references: data.references ?? [],
    acceptance_criteria: data.acceptance_criteria ?? '',
    notes: data.notes ?? '',
    created_at: now,
    updated_at: now,
  };

  db.prepare(
    `
      INSERT INTO tasks (
        id, title, summary, status, priority, dependencies, refs,
        acceptance_criteria, notes, created_at, updated_at
      ) VALUES (
        @id, @title, @summary, @status, @priority, @dependencies, @refs,
        @acceptance_criteria, @notes, @created_at, @updated_at
      )
    `,
  ).run({
    id: task.id,
    title: task.title,
    summary: task.summary,
    status: task.status,
    priority: task.priority,
    dependencies: JSON.stringify(task.dependencies),
    refs: JSON.stringify(task.references),
    acceptance_criteria: task.acceptance_criteria,
    notes: task.notes,
    created_at: task.created_at,
    updated_at: task.updated_at,
  });

  return task;
}

export function getTask(db: DatabaseSync, id: string): Task | null {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as TaskRow | undefined;
  return row ? mapTask(row) : null;
}

export function listTasks(
  db: DatabaseSync,
  filters?: { status?: TaskStatus; priority?: TaskPriority },
): Task[] {
  const clauses: string[] = [];
  const params: Array<string> = [];

  if (filters?.status) {
    clauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters?.priority) {
    clauses.push('priority = ?');
    params.push(filters.priority);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM tasks ${where} ORDER BY created_at DESC`)
    .all(...params) as TaskRow[];
  return rows.map(mapTask);
}

export function updateTask(db: DatabaseSync, id: string, data: Partial<Task>): Task {
  const current = getTask(db, id);
  if (!current) {
    throw new Error(`Task not found: ${id}`);
  }

  const definedUpdates = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  ) as Partial<Task>;

  const updated: Task = {
    ...current,
    ...definedUpdates,
    id: current.id,
    created_at: current.created_at,
    updated_at: new Date().toISOString(),
  };

  db.prepare(
    `
      UPDATE tasks
      SET title = @title,
          summary = @summary,
          status = @status,
          priority = @priority,
          dependencies = @dependencies,
          refs = @refs,
          acceptance_criteria = @acceptance_criteria,
          notes = @notes,
          updated_at = @updated_at
      WHERE id = @id
    `,
  ).run({
    id: updated.id,
    title: updated.title,
    summary: updated.summary,
    status: updated.status,
    priority: updated.priority,
    dependencies: JSON.stringify(updated.dependencies),
    refs: JSON.stringify(updated.references),
    acceptance_criteria: updated.acceptance_criteria,
    notes: updated.notes,
    updated_at: updated.updated_at,
  });

  return updated;
}

export function deleteTask(db: DatabaseSync, id: string): void {
  db.prepare('DELETE FROM task_logs WHERE task_id = ?').run(id);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function addTaskLog(
  db: DatabaseSync,
  taskId: string,
  message: string,
  filepath?: string,
): TaskLog {
  const task = getTask(db, taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const log: TaskLog = {
    id: makeId(),
    task_id: taskId,
    message,
    filepath: filepath ?? null,
    created_at: new Date().toISOString(),
  };

  db.prepare(
    `
      INSERT INTO task_logs (id, task_id, message, filepath, created_at)
      VALUES (@id, @task_id, @message, @filepath, @created_at)
    `,
  ).run({
    id: log.id,
    task_id: log.task_id,
    message: log.message,
    filepath: log.filepath,
    created_at: log.created_at,
  });

  return log;
}

export function getTaskLogs(db: DatabaseSync, taskId: string): TaskLog[] {
  return db
    .prepare('SELECT * FROM task_logs WHERE task_id = ? ORDER BY created_at DESC, rowid DESC')
    .all(taskId) as unknown as TaskLogRow[];
}
