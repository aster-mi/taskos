import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { buildAggregate } from '../aggregate/index.js';
import {
  addTaskLog,
  createTask,
  getTask,
  getTaskLogs,
  listEvents,
  listTasks,
  updateTask,
} from '../models/task.js';
import type { Task, TaskPriority, TaskStatus } from '../models/task.js';
import { getTasksDir } from '../paths.js';
import { writeTaskMarkdown } from '../markdown.js';

const TASK_STATUSES = ['todo', 'in-progress', 'done', 'blocked', 'cancelled'] satisfies TaskStatus[];
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] satisfies TaskPriority[];

type ErrorBody = { error: string };

type TaskCreateBody = {
  title?: unknown;
  summary?: unknown;
  priority?: unknown;
  acceptance_criteria?: unknown;
  dependencies?: unknown;
  notes?: unknown;
};

type TaskUpdateBody = {
  title?: unknown;
  summary?: unknown;
  priority?: unknown;
  status?: unknown;
  acceptance_criteria?: unknown;
  dependencies?: unknown;
  references?: unknown;
  notes?: unknown;
};

type LinkBody = {
  filepath?: unknown;
  message?: unknown;
};

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && TASK_STATUSES.includes(value as TaskStatus);
}

function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === 'string' && TASK_PRIORITIES.includes(value as TaskPriority);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function createError(message: string, status = 400): Error & { status?: number } {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function assertTask(task: Task | null, id: string): Task {
  if (!task) {
    throw createError(`Task not found: ${id}`, 404);
  }
  return task;
}

function validateStatusTransition(currentStatus: TaskStatus, nextStatus: TaskStatus): void {
  if (currentStatus === 'done' && nextStatus === 'todo') {
    throw createError('Changing status from done to todo requires --force');
  }

  if (currentStatus === 'cancelled' && nextStatus !== 'cancelled') {
    throw createError('Changing status from cancelled requires --force');
  }
}

function validateDoneTransition(currentStatus: TaskStatus): void {
  if (currentStatus === 'cancelled') {
    throw createError('Changing status from cancelled requires --force');
  }
}

function parseTaskCreateBody(body: TaskCreateBody) {
  if (typeof body.title !== 'string' || body.title.trim() === '') {
    throw createError('title is required');
  }

  if (body.summary !== undefined && typeof body.summary !== 'string') {
    throw createError('summary must be a string');
  }

  if (body.priority !== undefined && !isTaskPriority(body.priority)) {
    throw createError('priority must be one of: low, medium, high, urgent');
  }

  if (
    body.acceptance_criteria !== undefined &&
    typeof body.acceptance_criteria !== 'string'
  ) {
    throw createError('acceptance_criteria must be a string');
  }

  if (body.dependencies !== undefined && !isStringArray(body.dependencies)) {
    throw createError('dependencies must be an array of strings');
  }

  if (body.notes !== undefined && typeof body.notes !== 'string') {
    throw createError('notes must be a string');
  }

  return {
    title: body.title.trim(),
    summary: body.summary,
    priority: body.priority,
    acceptance_criteria: body.acceptance_criteria,
    dependencies: body.dependencies,
    notes: body.notes,
  };
}

function parseTaskUpdateBody(body: TaskUpdateBody): Partial<Task> {
  const updates: Partial<Task> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim() === '') {
      throw createError('title must be a non-empty string');
    }
    updates.title = body.title.trim();
  }

  if (body.summary !== undefined) {
    if (typeof body.summary !== 'string') {
      throw createError('summary must be a string');
    }
    updates.summary = body.summary;
  }

  if (body.priority !== undefined) {
    if (!isTaskPriority(body.priority)) {
      throw createError('priority must be one of: low, medium, high, urgent');
    }
    updates.priority = body.priority;
  }

  if (body.status !== undefined) {
    if (!isTaskStatus(body.status)) {
      throw createError('status must be one of: todo, in-progress, done, blocked, cancelled');
    }
    updates.status = body.status;
  }

  if (body.acceptance_criteria !== undefined) {
    if (typeof body.acceptance_criteria !== 'string') {
      throw createError('acceptance_criteria must be a string');
    }
    updates.acceptance_criteria = body.acceptance_criteria;
  }

  if (body.dependencies !== undefined) {
    if (!isStringArray(body.dependencies)) {
      throw createError('dependencies must be an array of strings');
    }
    updates.dependencies = body.dependencies;
  }

  if (body.references !== undefined) {
    if (!isStringArray(body.references)) {
      throw createError('references must be an array of strings');
    }
    updates.references = body.references.map((reference) => path.normalize(reference));
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string') {
      throw createError('notes must be a string');
    }
    updates.notes = body.notes;
  }

  return updates;
}

function parseLinkBody(body: LinkBody): { filepath: string; message?: string } {
  if (typeof body.filepath !== 'string' || body.filepath.trim() === '') {
    throw createError('filepath is required');
  }

  if (body.message !== undefined && typeof body.message !== 'string') {
    throw createError('message must be a string');
  }

  return {
    filepath: path.normalize(body.filepath.trim()),
    message: body.message,
  };
}

function parseStatusFilter(value: unknown): TaskStatus | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isTaskStatus(value)) {
    throw createError('status must be one of: todo, in-progress, done, blocked, cancelled');
  }
  return value;
}

function parsePriorityFilter(value: unknown): TaskPriority | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isTaskPriority(value)) {
    throw createError('priority must be one of: low, medium, high, urgent');
  }
  return value;
}

function handleError(error: unknown, res: Response<ErrorBody>) {
  if (error instanceof Error) {
    const status =
      typeof (error as Error & { status?: number }).status === 'number'
        ? (error as Error & { status?: number }).status!
        : error.message.startsWith('Task not found:')
          ? 404
          : 500;
    res.status(status).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}

export function createApiRouter(db: DatabaseSync): Router {
  const router = Router();

  router.get('/tasks', (req: Request, res: Response) => {
    try {
      const status = parseStatusFilter(req.query.status);
      const priority = parsePriorityFilter(req.query.priority);
      const tag = typeof req.query.tag === 'string' ? req.query.tag : undefined;
      res.json(listTasks(db, { status, priority, tag }));
    } catch (error) {
      handleError(error, res);
    }
  });

  router.get('/history', (req: Request, res: Response) => {
    try {
      const since = typeof req.query.since === 'string' ? req.query.since : undefined;
      const statusTo = typeof req.query.status === 'string' ? req.query.status : undefined;
      res.json(listEvents(db, { since, statusTo }));
    } catch (error) {
      handleError(error, res);
    }
  });

  router.post('/tasks', (req: Request, res: Response) => {
    try {
      const task = createTask(db, parseTaskCreateBody(req.body as TaskCreateBody));
      writeTaskMarkdown(task, getTaskLogs(db, task.id));
      res.status(201).json(task);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.get('/tasks/:id', (req: Request, res: Response) => {
    try {
      res.json(assertTask(getTask(db, req.params.id), req.params.id));
    } catch (error) {
      handleError(error, res);
    }
  });

  router.get('/tasks/:id/aggregate', (req: Request, res: Response) => {
    try {
      const task = assertTask(getTask(db, req.params.id), req.params.id);
      const logs = getTaskLogs(db, task.id);
      res.json(buildAggregate(task, logs, getTasksDir()));
    } catch (error) {
      handleError(error, res);
    }
  });

  router.patch('/tasks/:id', (req: Request, res: Response) => {
    try {
      const current = assertTask(getTask(db, req.params.id), req.params.id);
      const updates = parseTaskUpdateBody(req.body as TaskUpdateBody);
      if (updates.status) {
        validateStatusTransition(current.status, updates.status);
      }
      const task = updateTask(db, req.params.id, updates);
      writeTaskMarkdown(task, getTaskLogs(db, task.id));
      res.json(task);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.post('/tasks/:id/done', (req: Request, res: Response) => {
    try {
      const current = assertTask(getTask(db, req.params.id), req.params.id);
      validateDoneTransition(current.status);
      const task = updateTask(db, req.params.id, { status: 'done' });
      writeTaskMarkdown(task, getTaskLogs(db, task.id));
      res.json(task);
    } catch (error) {
      handleError(error, res);
    }
  });

  router.post('/tasks/:id/links', (req: Request, res: Response) => {
    try {
      const current = assertTask(getTask(db, req.params.id), req.params.id);
      const { filepath, message } = parseLinkBody(req.body as LinkBody);
      const nextReferences = current.references.includes(filepath)
        ? current.references
        : [...current.references, filepath];
      const task = updateTask(db, req.params.id, { references: nextReferences });
      const log = addTaskLog(db, req.params.id, message ?? 'Added reference', filepath);
      writeTaskMarkdown(task, getTaskLogs(db, task.id));
      res.status(201).json({ task, log });
    } catch (error) {
      handleError(error, res);
    }
  });

  return router;
}
