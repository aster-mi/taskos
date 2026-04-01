import type { DatabaseSync } from 'node:sqlite';

function migrateSchema(db: DatabaseSync): void {
  // Add columns that may be missing in older DBs
  const migrations = [
    "ALTER TABLE tasks ADD COLUMN tags TEXT DEFAULT '[]'",
    `CREATE TABLE IF NOT EXISTS task_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      status_from TEXT NOT NULL,
      status_to TEXT NOT NULL,
      changed_at TEXT NOT NULL
    )`,
  ];
  for (const sql of migrations) {
    try {
      db.exec(sql);
    } catch {
      // column/table already exists — skip
    }
  }
}

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
      tags TEXT DEFAULT '[]',
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

    CREATE TABLE IF NOT EXISTS task_events (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id),
      status_from TEXT NOT NULL,
      status_to TEXT NOT NULL,
      changed_at TEXT NOT NULL
    );
  `);
  migrateSchema(db);
}
