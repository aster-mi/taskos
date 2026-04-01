import type { Command } from 'commander';
import { listEvents } from '../models/task.js';
import { requireInitialized } from '../paths.js';

type HistoryOptions = {
  since?: string;
  status?: string;
  json?: boolean;
};

function formatTable(rows: string[][]): string {
  const widths = rows[0].map((_, index) => Math.max(...rows.map((row) => row[index].length)));
  return rows
    .map((row) => row.map((cell, index) => cell.padEnd(widths[index])).join('  '))
    .join('\n');
}

export function registerHistoryCommand(program: Command): void {
  program
    .command('history')
    .description('Show task status change history')
    .option('--since <date>', 'Show events on or after this date (YYYY-MM-DD or ISO)')
    .option('--status <status>', 'Filter by target status (e.g. done)')
    .option('--json', 'Output JSON')
    .action((options: HistoryOptions) => {
      const db = requireInitialized();
      const events = listEvents(db, {
        since: options.since,
        statusTo: options.status,
      });

      if (options.json) {
        console.log(JSON.stringify(events, null, 2));
        return;
      }

      if (events.length === 0) {
        console.log('No events found');
        return;
      }

      const rows = [
        ['CHANGED_AT', 'TASK_ID', 'FROM', 'TO', 'TITLE'],
        ...events.map((e) => [
          e.changed_at.replace('T', ' ').slice(0, 16),
          e.task_id,
          e.status_from,
          e.status_to,
          e.task_title,
        ]),
      ];
      console.log(formatTable(rows));
    });
}
