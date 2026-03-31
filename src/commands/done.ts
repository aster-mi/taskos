import type { Command } from 'commander';
import { getTask, getTaskLogs, updateTask } from '../models/task.js';
import { requireInitialized } from '../paths.js';
import { writeTaskMarkdown } from '../markdown.js';

function validateDoneTransition(currentStatus: string): void {
  if (currentStatus === 'cancelled') {
    throw new Error('Changing status from cancelled requires --force');
  }
}

export function registerDoneCommand(program: Command): void {
  program
    .command('done')
    .description('Mark a task as done')
    .argument('<id>', 'Task ID')
    .action((id: string) => {
      const db = requireInitialized();
      const task = getTask(db, id);
      if (!task) {
        throw new Error(`Task not found: ${id}`);
      }

      validateDoneTransition(task.status);
      const updated = updateTask(db, id, { status: 'done' });
      writeTaskMarkdown(updated, getTaskLogs(db, id));
      console.log(`Completed task ${id}`);
    });
}
