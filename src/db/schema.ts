import type { DatabaseSync } from 'node:sqlite';

export function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'todo',
      priority TEXT NOT NULL DEFAULT 'medium',
      dependencies TEXT DEFAULT '[]',
      refs TEXT DEFAULT '[]',
      acceptance_criteria TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      message TEXT NOT NULL,
      filepath TEXT DEFAULT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
