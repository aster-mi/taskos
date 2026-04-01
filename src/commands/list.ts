import type { Command } from 'commander';
import { listTasks } from '../models/task.js';
import type { TaskPriority, TaskStatus } from '../models/task.js';
import { requireInitialized } from '../paths.js';

type ListOptions = {
  status?: TaskStatus;
  priority?: TaskPriority;
  tag?: string;
  since?: string;
  json?: boolean;
};

function formatTable(rows: string[][]): string {
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => row[index].length)));
  return rows
    .map((row) => row.map((cell, index) => cell.padEnd(widths[index])).join('  '))
    .join('\n');
}

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List tasks')
    .option('-s, --status <status>', 'Filter by status')
    .option('-p, --priority <priority>', 'Filter by priority')
    .option('--tag <tag>', 'Filter by tag')
    .option('--since <date>', 'Show tasks updated on or after this date (YYYY-MM-DD or ISO)')
    .option('--json', 'Output JSON')
    .action((options: ListOptions) => {
      const db = requireInitialized();
      const tasks = listTasks(db, {
        status: options.status,
        priority: options.priority,
        tag: options.tag,
        since: options.since,
      });

      if (options.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      const rows = [
        ['ID', 'STATUS', 'PRIORITY', 'TITLE'],
        ...tasks.map((task) => [task.id, task.status, task.priority, task.title]),
      ];
      console.log(formatTable(rows));
    });
}
