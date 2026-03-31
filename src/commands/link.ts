import path from 'node:path';
import type { Command } from 'commander';
import { addTaskLog, getTask, getTaskLogs, updateTask } from '../models/task.js';
import { requireInitialized } from '../paths.js';
import { writeTaskMarkdown } from '../markdown.js';

type LinkOptions = {
  message?: string;
};

export function registerLinkCommand(program: Command): void {
  program
    .command('link')
    .description('Add a reference file to a task')
    .argument('<id>', 'Task ID')
    .argument('<filepath>', 'Reference filepath')
    .option('-m, --message <message>', 'Log message', 'Added reference')
    .action((id: string, filepath: string, options: LinkOptions) => {
      const db = requireInitialized();
      const task = getTask(db, id);
      if (!task) {
        throw new Error(`Task not found: ${id}`);
      }

      const normalizedPath = path.normalize(filepath);
      const nextReferences = task.references.includes(normalizedPath)
        ? task.references
        : [...task.references, normalizedPath];
      const updated = updateTask(db, id, { references: nextReferences });
      addTaskLog(db, id, options.message ?? 'Added reference', normalizedPath);
      writeTaskMarkdown(updated, getTaskLogs(db, id));
      console.log(`Linked ${normalizedPath} to task ${id}`);
    });
}
