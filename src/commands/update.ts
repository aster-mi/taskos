import type { Command } from 'commander';
import { getTask, getTaskLogs, updateTask } from '../models/task.js';
import type { TaskPriority, TaskStatus } from '../models/task.js';
import { requireInitialized } from '../paths.js';
import { writeTaskMarkdown } from '../markdown.js';

type UpdateOptions = {
  title?: string;
  summary?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  criteria?: string;
  notes?: string;
  deps?: string;
  force?: boolean;
};

function validateStatusTransition(currentStatus: TaskStatus, nextStatus: TaskStatus, force = false): void {
  if (!force && currentStatus === 'done' && nextStatus === 'todo') {
    throw new Error('Changing status from done to todo requires --force');
  }

  if (!force && currentStatus === 'cancelled' && nextStatus !== 'cancelled') {
    throw new Error('Changing status from cancelled requires --force');
  }
}

export function registerUpdateCommand(program: Command): void {
  program
    .command('update')
    .description('Update a task')
    .argument('<id>', 'Task ID')
    .option('-t, --title <title>', 'Task title')
    .option('-s, --summary <summary>', 'Task summary')
    .option('--status <status>', 'Task status')
    .option('-p, --priority <priority>', 'Task priority')
    .option('-c, --criteria <criteria>', 'Acceptance criteria')
    .option('-n, --notes <notes>', 'Task notes')
    .option('-d, --deps <deps>', 'Comma-separated dependency IDs')
    .option('--force', 'Force blocked status transitions')
    .action((id: string, options: UpdateOptions) => {
      const db = requireInitialized();
      const current = getTask(db, id);
      if (!current) {
        throw new Error(`Task not found: ${id}`);
      }

      if (options.status) {
        validateStatusTransition(current.status, options.status, options.force);
      }

      const task = updateTask(db, id, {
        title: options.title,
        summary: options.summary,
        status: options.status,
        priority: options.priority,
        acceptance_criteria: options.criteria,
        notes: options.notes,
        dependencies: options.deps
          ? options.deps.split(',').map((value) => value.trim()).filter(Boolean)
          : undefined,
      });

      writeTaskMarkdown(task, getTaskLogs(db, id));
      console.log(`Updated task ${task.id}`);
    });
}
