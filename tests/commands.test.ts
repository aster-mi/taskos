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

  it('requires initialization before use', async () => {
    const result = await runCli(['list']);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain('Run taskos init first');
  });

  it('supports init, add, list, show, update, done, and link', async () => {
    const initResult = await runCli(['init']);
    expect(initResult.code).toBe(0);
    expect(fs.existsSync(path.join(tempDir, '.taskos', 'taskos.db'))).toBe(true);

    const addResult = await runCli([
      'add',
      'Ship CLI',
      '--summary',
      'Implement everything',
      '--priority',
      'high',
      '--criteria',
      'All tests pass',
    ]);
    expect(addResult.code).toBe(0);
    expect(addResult.stdout).toContain('Created task');

    const taskId = /Created task (\w{8})/.exec(addResult.stdout)?.[1];
    expect(taskId).toBeTruthy();

    const listResult = await runCli(['list']);
    expect(listResult.stdout).toContain('Ship CLI');

    const showJson = await runCli(['show', taskId!, '--json']);
    expect(showJson.stdout).toContain('"title": "Ship CLI"');

    const updateResult = await runCli(['update', taskId!, '--status', 'in-progress', '--notes', 'Working']);
    expect(updateResult.stdout).toContain(`Updated task ${taskId}`);

    const doneResult = await runCli(['done', taskId!]);
    expect(doneResult.stdout).toContain(`Completed task ${taskId}`);

    const linkResult = await runCli(['link', taskId!, 'src/cli.ts', '--message', 'Linked entry point']);
    expect(linkResult.stdout).toContain(`Linked ${path.normalize('src/cli.ts')} to task ${taskId}`);

    const aggregateResult = await runCli(['show', taskId!, '--aggregate']);
    expect(aggregateResult.stdout).toContain('"references": [');
    expect(aggregateResult.stdout).toContain('src/cli.ts');

    const markdown = fs.readFileSync(path.join(tempDir, '.taskos', 'tasks', `${taskId}.md`), 'utf8');
    expect(markdown).toContain('Status: done');
    expect(markdown).toContain('src/cli.ts');
    expect(markdown).toContain('Linked entry point');
  });
});
