import type { Command } from 'commander';
import { buildAggregate } from '../aggregate/index.js';
import { getTask, getTaskLogs } from '../models/task.js';
import { getTasksDir, requireInitialized } from '../paths.js';

type ShowOptions = {
  aggregate?: boolean;
  json?: boolean;
};

export function registerShowCommand(program: Command): void {
  program
    .command('show')
    .description('Show a task')
    .argument('<id>', 'Task ID')
    .option('--aggregate', 'Output aggregate JSON')
    .option('--json', 'Output raw JSON')
    .action((id: string, options: ShowOptions) => {
      const db = requireInitialized();
      const task = getTask(db, id);
      if (!task) {
        throw new Error(`Task not found: ${id}`);
      }

      const logs = getTaskLogs(db, id);

      if (options.aggregate) {
        console.log(JSON.stringify(buildAggregate(task, logs, getTasksDir()), null, 2));
        return;
      }

      if (options.json) {
        console.log(JSON.stringify({ ...task, logs }, null, 2));
        return;
      }

      console.log([
        `${task.id}: ${task.title}`,
        `Status: ${task.status}`,
        `Priority: ${task.priority}`,
        `Summary: ${task.summary || '-'}`,
        `Acceptance Criteria: ${task.acceptance_criteria || '-'}`,
        `Dependencies: ${task.dependencies.join(', ') || '-'}`,
        `References: ${task.references.join(', ') || '-'}`,
        `Notes: ${task.notes || '-'}`,
        'Logs:',
        ...(logs.length > 0
          ? logs.map((log) => `- ${log.created_at}: ${log.message}${log.filepath ? ` (${log.filepath})` : ''}`)
          : ['- None']),
      ].join('\n'));
    });
}
