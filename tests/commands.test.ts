import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { run } from '../src/cli.js';
import { closeAllDbs } from '../src/db/index.js';

let tempDir = '';
let originalCwd = '';
let stdoutSpy: ReturnType<typeof vi.spyOn>;
let stderrSpy: ReturnType<typeof vi.spyOn>;

async function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  stdoutSpy.mockImplementation((message?: unknown) => {
    stdout.push(String(message ?? ''));
  });
  stderrSpy.mockImplementation((message?: unknown) => {
    stderr.push(String(message ?? ''));
  });
  const code = await run(['node', 'taskos', ...args], false);
  return { code, stdout: stdout.join('\n'), stderr: stderr.join('\n') };
}

describe('taskos CLI', () => {
  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskos-'));
    process.chdir(tempDir);
    stdoutSpy = vi.spyOn(console, 'log');
    stderrSpy = vi.spyOn(console, 'error');
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    closeAllDbs();
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ── initialization ────────────────────────────────────────────

  it('requires initialization before use', async () => {
    const result = await runCli(['list']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Run taskos init first');
  });

  it('init creates expected directory structure and gitignore entry', async () => {
    const result = await runCli(['init']);
    expect(result.code).toBe(0);
    expect(fs.existsSync(path.join(tempDir, '.taskos', 'taskos.db'))).toBe(true);
    expect(fs.existsSync(path.join(tempDir, '.taskos', 'tasks'))).toBe(true);
    const gitignore = fs.readFileSync(path.join(tempDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.taskos/taskos.db');
  });

  it('init is idempotent', async () => {
    await runCli(['init']);
    const result = await runCli(['init']);
    expect(result.code).toBe(0);
  });

  // ── add ───────────────────────────────────────────────────────

  it('add creates task and markdown file', async () => {
    await runCli(['init']);
    const result = await runCli(['add', 'Ship CLI', '--summary', 'Implement everything', '--priority', 'high', '--criteria', 'All tests pass']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Created task');

    const taskId = /Created task (\w{8})/.exec(result.stdout)?.[1];
    expect(taskId).toBeTruthy();

    const mdPath = path.join(tempDir, '.taskos', 'tasks', `${taskId}.md`);
    expect(fs.existsSync(mdPath)).toBe(true);
    const md = fs.readFileSync(mdPath, 'utf8');
    expect(md).toContain('Ship CLI');
    expect(md).toContain('Status: todo');
    expect(md).toContain('All tests pass');
  });

  it('add with dependencies and notes', async () => {
    await runCli(['init']);
    const add1 = await runCli(['add', 'Task A']);
    const id1 = /Created task (\w{8})/.exec(add1.stdout)?.[1]!;

    const add2 = await runCli(['add', 'Task B', '--deps', id1, '--notes', 'depends on A']);
    expect(add2.code).toBe(0);

    const id2 = /Created task (\w{8})/.exec(add2.stdout)?.[1]!;
    const show = await runCli(['show', id2, '--json']);
    const task = JSON.parse(show.stdout);
    expect(task.dependencies).toContain(id1);
    expect(task.notes).toBe('depends on A');
  });

  // ── list ──────────────────────────────────────────────────────

  it('list shows table output', async () => {
    await runCli(['init']);
    await runCli(['add', 'Ship CLI']);
    const result = await runCli(['list']);
    expect(result.stdout).toContain('Ship CLI');
    expect(result.stdout).toContain('todo');
  });

  it('list --json returns valid JSON array', async () => {
    await runCli(['init']);
    await runCli(['add', 'Task A', '--priority', 'high']);
    await runCli(['add', 'Task B', '--priority', 'low']);
    const result = await runCli(['list', '--json']);
    const tasks = JSON.parse(result.stdout);
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks).toHaveLength(2);
  });

  it('list filters by status', async () => {
    await runCli(['init']);
    const add1 = await runCli(['add', 'Task A']);
    const id1 = /Created task (\w{8})/.exec(add1.stdout)?.[1]!;
    await runCli(['add', 'Task B']);
    await runCli(['update', id1, '--status', 'in-progress']);

    const result = await runCli(['list', '--status', 'in-progress', '--json']);
    const tasks = JSON.parse(result.stdout);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Task A');
  });

  it('list filters by priority', async () => {
    await runCli(['init']);
    await runCli(['add', 'High task', '--priority', 'high']);
    await runCli(['add', 'Low task', '--priority', 'low']);

    const result = await runCli(['list', '--priority', 'high', '--json']);
    const tasks = JSON.parse(result.stdout);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('High task');
  });

  it('list shows empty when no tasks match filter', async () => {
    await runCli(['init']);
    await runCli(['add', 'Task A']);
    const result = await runCli(['list', '--status', 'done', '--json']);
    const tasks = JSON.parse(result.stdout);
    expect(tasks).toHaveLength(0);
  });

  // ── show ──────────────────────────────────────────────────────

  it('show --json returns task JSON', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Ship CLI', '--priority', 'high']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;

    const result = await runCli(['show', id, '--json']);
    expect(result.code).toBe(0);
    const task = JSON.parse(result.stdout);
    expect(task.title).toBe('Ship CLI');
    expect(task.priority).toBe('high');
    expect(task.status).toBe('todo');
  });

  it('show --aggregate returns aggregate JSON with recent_logs', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Ship CLI']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;
    await runCli(['link', id, 'src/foo.ts', '--message', 'Added foo']);

    const result = await runCli(['show', id, '--aggregate']);
    expect(result.code).toBe(0);
    const agg = JSON.parse(result.stdout);
    expect(agg.recent_logs).toHaveLength(1);
    expect(agg.recent_logs[0].message).toBe('Added foo');
    expect(agg.markdown_file).toContain(`${id}.md`);
  });

  it('show errors on unknown id', async () => {
    await runCli(['init']);
    const result = await runCli(['show', 'notexist', '--json']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('not found');
  });

  // ── update ────────────────────────────────────────────────────

  it('update changes multiple fields and updates markdown', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;

    const result = await runCli(['update', id, '--status', 'in-progress', '--notes', 'Working on it', '--priority', 'urgent']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(`Updated task ${id}`);

    const show = await runCli(['show', id, '--json']);
    const task = JSON.parse(show.stdout);
    expect(task.status).toBe('in-progress');
    expect(task.notes).toBe('Working on it');
    expect(task.priority).toBe('urgent');

    const md = fs.readFileSync(path.join(tempDir, '.taskos', 'tasks', `${id}.md`), 'utf8');
    expect(md).toContain('Status: in-progress');
  });

  it('update errors on unknown id', async () => {
    await runCli(['init']);
    const result = await runCli(['update', 'notexist', '--status', 'done']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('not found');
  });

  // ── status transition validation ──────────────────────────────

  it('blocks done -> todo without --force', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;
    await runCli(['done', id]);

    const result = await runCli(['update', id, '--status', 'todo']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--force');
  });

  it('allows done -> todo with --force', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;
    await runCli(['done', id]);

    const result = await runCli(['update', id, '--status', 'todo', '--force']);
    expect(result.code).toBe(0);

    const show = await runCli(['show', id, '--json']);
    expect(JSON.parse(show.stdout).status).toBe('todo');
  });

  it('blocks cancelled -> other status without --force', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;
    await runCli(['update', id, '--status', 'cancelled']);

    const result = await runCli(['update', id, '--status', 'in-progress']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('--force');
  });

  it('allows valid forward transitions without --force', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;

    expect((await runCli(['update', id, '--status', 'in-progress'])).code).toBe(0);
    expect((await runCli(['update', id, '--status', 'blocked'])).code).toBe(0);
    expect((await runCli(['update', id, '--status', 'done'])).code).toBe(0);
  });

  // ── done ──────────────────────────────────────────────────────

  it('done marks task as done', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Ship CLI']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;

    const result = await runCli(['done', id]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(`Completed task ${id}`);

    const show = await runCli(['show', id, '--json']);
    expect(JSON.parse(show.stdout).status).toBe('done');
  });

  // ── link ──────────────────────────────────────────────────────

  it('link adds reference and log, updates markdown', async () => {
    await runCli(['init']);
    const add = await runCli(['add', 'Task']);
    const id = /Created task (\w{8})/.exec(add.stdout)?.[1]!;

    const result = await runCli(['link', id, 'src/cli.ts', '--message', 'Linked entry point']);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain(`Linked ${path.normalize('src/cli.ts')} to task ${id}`);

    const agg = JSON.parse((await runCli(['show', id, '--aggregate'])).stdout);
    expect(agg.references).toContain('src/cli.ts');
    expect(agg.recent_logs[0].message).toBe('Linked entry point');

    const md = fs.readFileSync(path.join(tempDir, '.taskos', 'tasks', `${id}.md`), 'utf8');
    expect(md).toContain('src/cli.ts');
    expect(md).toContain('Linked entry point');
  });

  it('link errors on unknown task id', async () => {
    await runCli(['init']);
    const result = await runCli(['link', 'notexist', 'src/file.ts']);
    expect(result.code).toBe(1);
  });

  // ── full happy path ───────────────────────────────────────────

  it('full workflow: init → add → update → link → done → aggregate', async () => {
    await runCli(['init']);

    const addResult = await runCli(['add', 'Ship CLI', '--summary', 'Implement everything', '--priority', 'high', '--criteria', 'All tests pass']);
    const taskId = /Created task (\w{8})/.exec(addResult.stdout)?.[1]!;
    expect(taskId).toBeTruthy();

    await runCli(['update', taskId, '--status', 'in-progress', '--notes', 'Working']);
    await runCli(['done', taskId]);
    await runCli(['link', taskId, 'src/cli.ts', '--message', 'Linked entry point']);

    const aggregateResult = await runCli(['show', taskId, '--aggregate']);
    const agg = JSON.parse(aggregateResult.stdout);
    expect(agg.status).toBe('done');
    expect(agg.references).toContain('src/cli.ts');
    expect(agg.recent_logs[0].message).toBe('Linked entry point');

    const markdown = fs.readFileSync(path.join(tempDir, '.taskos', 'tasks', `${taskId}.md`), 'utf8');
    expect(markdown).toContain('Status: done');
    expect(markdown).toContain('src/cli.ts');
  });
});
