import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createSchema } from './schema.js';

const dbCache = new Map<string, DatabaseSync>();

export function getDefaultDbPath(cwd = process.cwd()): string {
  return process.env.TASKOS_DB ?? path.join(cwd, '.taskos', 'taskos.db');
}

export function getDb(dbPath = getDefaultDbPath()): DatabaseSync {
  const resolvedPath = dbPath === ':memory:' ? dbPath : path.resolve(dbPath);

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const cached = dbCache.get(resolvedPath);
  if (cached) {
    return cached;
  }

  const db = new DatabaseSync(resolvedPath);
  createSchema(db);
  dbCache.set(resolvedPath, db);
  return db;
}

export function closeAllDbs(): void {
  for (const db of dbCache.values()) {
    db.close();
  }
  dbCache.clear();
}
