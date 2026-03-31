import fs from 'node:fs';
import { getTaskMarkdownPath } from './paths.js';
import type { Task, TaskLog } from './models/task.js';

function renderList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None';
}

function renderLogs(logs: TaskLog[]): string {
  if (logs.length === 0) {
    return '- None';
  }

  return logs
    .map((log) => {
      const filepath = log.filepath ? ` (${log.filepath})` : '';
      return `- ${log.created_at}: ${log.message}${filepath}`;
    })
    .join('\n');
}

export function renderTaskMarkdown(task: Task, logs: TaskLog[]): string {
  return `# ${task.title}

ID: ${task.id}
Status: ${task.status}
Priority: ${task.priority}
Created: ${task.created_at}
Updated: ${task.updated_at}

## Summary
${task.summary || '_No summary_'}

## Acceptance Criteria
${task.acceptance_criteria || '_No acceptance criteria_'}

## Dependencies
${renderList(task.dependencies)}

## References
${renderList(task.references)}

## Notes
${task.notes || '_No notes_'}

## Logs
${renderLogs(logs)}
`;
}

export function writeTaskMarkdown(task: Task, logs: TaskLog[], cwd = process.cwd()): string {
  const filePath = getTaskMarkdownPath(task.id, cwd);
  fs.writeFileSync(filePath, renderTaskMarkdown(task, logs), 'utf8');
  return filePath;
}
