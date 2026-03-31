import fs from 'node:fs';
import path from 'node:path';
import { getDb, getDefaultDbPath } from './db/index.js';

export function getTaskosDir(cwd = process.cwd()): string {
  return path.join(cwd, '.taskos');
}

export function getTasksDir(cwd = process.cwd()): string {
  return path.join(getTaskosDir(cwd), 'tasks');
}

export function getTaskMarkdownPath(taskId: string, cwd = process.cwd()): string {
  return path.join(getTasksDir(cwd), `${taskId}.md`);
}

export function ensureTaskosDirs(cwd = process.cwd()): void {
  fs.mkdirSync(getTasksDir(cwd), { recursive: true });
}

export function requireInitialized(cwd = process.cwd()) {
  const dbPath = getDefaultDbPath(cwd);
  const taskosDir = getTaskosDir(cwd);
  const tasksDir = getTasksDir(cwd);

  if (!fs.existsSync(taskosDir) || !fs.existsSync(tasksDir) || !fs.existsSync(dbPath)) {
    throw new Error('Run taskos init first');
  }

  return getDb(dbPath);
}
