import fs from 'node:fs';
import type { Command } from 'commander';
import { getTask, deleteTask } from '../models/task.js';
import { requireInitialized, getTaskMarkdownPath } from '../paths.js';

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete')
    .description('Delete a task')
    .argument('<id>', 'Task ID')
    .action((id: string) => {
      const db = requireInitialized();
      const task = getTask(db, id);
      if (!task) {
        throw new Error(`Task not found: ${id}`);
      }

      deleteTask(db, id);

      const mdPath = getTaskMarkdownPath(id);
      if (fs.existsSync(mdPath)) {
        fs.unlinkSync(mdPath);
      }

      console.log(`Deleted task ${id}`);
    });
}
