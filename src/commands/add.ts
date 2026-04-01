import type { Command } from 'commander';
import { getTaskLogs, createTask } from '../models/task.js';
import type { TaskPriority } from '../models/task.js';
import { requireInitialized } from '../paths.js';
import { writeTaskMarkdown } from '../markdown.js';

type AddOptions = {
  summary?: string;
  priority?: TaskPriority;
  criteria?: string;
  deps?: string;
  notes?: string;
  tag?: string;
};

export function registerAddCommand(program: Command): void {
  program
    .command('add')
    .description('Create a task')
    .argument('<title>', 'Task title')
    .option('-s, --summary <summary>', 'Task summary')
    .option('-p, --priority <priority>', 'Task priority', 'medium')
    .option('-c, --criteria <criteria>', 'Acceptance criteria')
    .option('-d, --deps <deps>', 'Comma-separated dependency IDs')
    .option('-n, --notes <notes>', 'Task notes')
    .option('--tag <tags>', 'Comma-separated tags')
    .action((title: string, options: AddOptions) => {
      const db = requireInitialized();
      const task = createTask(db, {
        title,
        summary: options.summary,
        priority: options.priority,
        acceptance_criteria: options.criteria,
        dependencies: options.deps
          ? options.deps.split(',').map((value) => value.trim()).filter(Boolean)
          : [],
        notes: options.notes,
        tags: options.tag
          ? options.tag.split(',').map((value) => value.trim()).filter(Boolean)
          : [],
      });
      writeTaskMarkdown(task, getTaskLogs(db, task.id));
      console.log(`Created task ${task.id}: ${task.title}`);
    });
}
