import fs from 'node:fs';
import path from 'node:path';
import type { Command } from 'commander';
import { getDefaultDbPath, getDb } from '../db/index.js';
import { ensureTaskosDirs, getTaskosDir } from '../paths.js';

function updateGitignore(cwd = process.cwd()): void {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entry = '.taskos/taskos.db';

  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${entry}\n`, 'utf8');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(Boolean);
  if (!lines.includes(entry)) {
    const next = content.endsWith('\n') || content.length === 0 ? `${content}${entry}\n` : `${content}\n${entry}\n`;
    fs.writeFileSync(gitignorePath, next, 'utf8');
  }
}

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize taskos in the current directory')
    .action(() => {
      ensureTaskosDirs();
      const dbPath = getDefaultDbPath();
      getDb(dbPath);
      updateGitignore();
      console.log(`Initialized taskos in ${getTaskosDir()}`);
    });
}
