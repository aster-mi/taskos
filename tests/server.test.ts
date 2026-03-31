import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import request from 'supertest';
import { createSchema } from '../src/db/schema.js';
import { createServer } from '../src/server/index.js';

function makeApp() {
  const db = new DatabaseSync(':memory:');
  createSchema(db);
  return createServer(db);
}

describe.sequential('server routes', () => {
  const originalCwd = process.cwd();
  let tempDir = '';

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskos-server-test-'));
    process.chdir(tempDir);
    fs.mkdirSync(path.join(tempDir, '.taskos', 'tasks'), { recursive: true });
  });

  afterAll(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('GET /api/tasks returns an empty array', async () => {
    const app = makeApp();

    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  test('GET /api/tasks filters by status and priority', async () => {
    const app = makeApp();

    await request(app).post('/api/tasks').send({ title: 'Todo medium' }).expect(201);
    const doneTask = await request(app)
      .post('/api/tasks')
      .send({ title: 'Done high', priority: 'high' })
      .expect(201);
    const urgent = await request(app)
      .post('/api/tasks')
      .send({ title: 'Blocked urgent', priority: 'urgent' })
      .expect(201);
    await request(app).patch(`/api/tasks/${urgent.body.id}`).send({ status: 'blocked' }).expect(200);
    await request(app).post(`/api/tasks/${doneTask.body.id}/done`).send({}).expect(200);

    const blockedResponse = await request(app).get('/api/tasks').query({ status: 'blocked' });
    const urgentResponse = await request(app).get('/api/tasks').query({ priority: 'urgent' });
    const doneResponse = await request(app).get('/api/tasks').query({ status: 'done' });

    expect(blockedResponse.status).toBe(200);
    expect(blockedResponse.body).toHaveLength(1);
    expect(blockedResponse.body[0]).toMatchObject({
      id: urgent.body.id,
      title: 'Blocked urgent',
      status: 'blocked',
    });

    expect(urgentResponse.status).toBe(200);
    expect(urgentResponse.body).toHaveLength(1);
    expect(urgentResponse.body[0]).toMatchObject({
      id: urgent.body.id,
      priority: 'urgent',
    });

    expect(doneResponse.status).toBe(200);
    expect(doneResponse.body).toHaveLength(1);
    expect(doneResponse.body[0]).toMatchObject({
      title: 'Done high',
      status: 'done',
    });
  });

  test('POST /api/tasks creates a task', async () => {
    const app = makeApp();

    const response = await request(app).post('/api/tasks').send({
      title: 'Ship tests',
      summary: 'Cover the web layer',
      priority: 'high',
      acceptance_criteria: 'Tests pass',
      notes: 'Important',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Ship tests',
      summary: 'Cover the web layer',
      priority: 'high',
      status: 'todo',
      acceptance_criteria: 'Tests pass',
      notes: 'Important',
    });
    expect(response.body.id).toEqual(expect.any(String));
  });

  test('POST /api/tasks returns 400 when title is missing', async () => {
    const app = makeApp();

    const response = await request(app).post('/api/tasks').send({ summary: 'Missing title' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'title is required' });
  });

  test('GET /api/tasks/:id returns 404 for an unknown task', async () => {
    const app = makeApp();

    const response = await request(app).get('/api/tasks/missing123');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found: missing123' });
  });

  test('GET /api/tasks/:id returns an existing task', async () => {
    const app = makeApp();

    const task = await request(app)
      .post('/api/tasks')
      .send({ title: 'Fetch me', summary: 'Load a single task' })
      .expect(201);

    const response = await request(app).get(`/api/tasks/${task.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.body.id,
      title: 'Fetch me',
      summary: 'Load a single task',
    });
  });

  test('GET /api/tasks/:id/aggregate includes recent_logs', async () => {
    const app = makeApp();

    const task = await request(app).post('/api/tasks').send({ title: 'Aggregate me' }).expect(201);
    await request(app)
      .post(`/api/tasks/${task.body.id}/links`)
      .send({ filepath: 'src/example.ts', message: 'Added source file' })
      .expect(201);

    const response = await request(app).get(`/api/tasks/${task.body.id}/aggregate`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.body.id,
      title: 'Aggregate me',
    });
    expect(response.body.recent_logs).toEqual([
      expect.objectContaining({
        message: 'Added source file',
        filepath: 'src/example.ts',
        created_at: expect.any(String),
      }),
    ]);
  });

  test('PATCH /api/tasks/:id updates task fields', async () => {
    const app = makeApp();

    const task = await request(app).post('/api/tasks').send({ title: 'Before' }).expect(201);

    const response = await request(app).patch(`/api/tasks/${task.body.id}`).send({
      title: 'After',
      status: 'in-progress',
      priority: 'urgent',
      references: ['docs/spec.md'],
      notes: 'Updated',
    });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.body.id,
      title: 'After',
      status: 'in-progress',
      priority: 'urgent',
      references: ['docs/spec.md'],
      notes: 'Updated',
    });
  });

  test('PATCH /api/tasks/:id returns 404 for an unknown task', async () => {
    const app = makeApp();

    const response = await request(app).patch('/api/tasks/missing123').send({ title: 'After' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found: missing123' });
  });

  test('POST /api/tasks/:id/done marks a task done', async () => {
    const app = makeApp();

    const task = await request(app).post('/api/tasks').send({ title: 'Finish me' }).expect(201);

    const response = await request(app).post(`/api/tasks/${task.body.id}/done`).send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: task.body.id,
      status: 'done',
    });
  });

  test('POST /api/tasks/:id/done returns 404 for an unknown task', async () => {
    const app = makeApp();

    const response = await request(app).post('/api/tasks/missing123/done').send({});

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found: missing123' });
  });

  test('POST /api/tasks/:id/links adds a link', async () => {
    const app = makeApp();

    const task = await request(app).post('/api/tasks').send({ title: 'Link me' }).expect(201);

    const response = await request(app)
      .post(`/api/tasks/${task.body.id}/links`)
      .send({ filepath: 'src/server/routes.ts', message: 'Relevant code' });

    expect(response.status).toBe(201);
    expect(response.body.task).toMatchObject({
      id: task.body.id,
      references: ['src/server/routes.ts'],
    });
    expect(response.body.log).toMatchObject({
      task_id: task.body.id,
      message: 'Relevant code',
      filepath: 'src/server/routes.ts',
    });
  });

  test('POST /api/tasks/:id/links returns 400 when filepath is missing', async () => {
    const app = makeApp();

    const task = await request(app).post('/api/tasks').send({ title: 'Link me' }).expect(201);

    const response = await request(app).post(`/api/tasks/${task.body.id}/links`).send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'filepath is required' });
  });
});
