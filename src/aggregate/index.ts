import path from 'node:path';
import type { Task, TaskLog, TaskPriority, TaskStatus } from '../models/task.js';

export interface TaskAggregate {
  id: string;
  title: string;
  summary: string;
  status: TaskStatus;
  priority: TaskPriority;
  acceptance_criteria: string;
  dependencies: string[];
  references: string[];
  tags: string[];
  recent_logs: Array<{ message: string; filepath?: string; created_at: string }>;
  notes: string;
  markdown_file: string;
  created_at: string;
  updated_at: string;
}

export function buildAggregate(task: Task, logs: TaskLog[], tasksDir: string): TaskAggregate {
  return {
    id: task.id,
    title: task.title,
    summary: task.summary,
    status: task.status,
    priority: task.priority,
    acceptance_criteria: task.acceptance_criteria,
    dependencies: task.dependencies,
    references: task.references,
    tags: task.tags,
    recent_logs: logs.slice(0, 10).map((log) => ({
      message: log.message,
      ...(log.filepath ? { filepath: log.filepath } : {}),
      created_at: log.created_at,
    })),
    notes: task.notes,
    markdown_file: path.join(tasksDir, `${task.id}.md`),
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}
