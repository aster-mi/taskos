import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Command } from 'commander';
import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from '../server/index.js';
import { requireInitialized } from '../paths.js';

type ServeOptions = {
  open?: boolean;
  port?: string;
};

const webDistPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../web/dist',
);

function openBrowser(url: string): void {
  const command =
    process.platform === 'darwin'
      ? ['open', url]
      : process.platform === 'win32'
        ? ['cmd', '/c', 'start', '', url]
        : ['xdg-open', url];

  const [file, ...args] = command;
  const child = spawn(file, args, { stdio: 'ignore', detached: true });
  child.unref();
}

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start the local taskos web server')
    .option('-p, --port <number>', 'Port to listen on', '3000')
    .option('--open', 'Open the app in a browser')
    .action((options: ServeOptions) => {
      const db = requireInitialized();
      const app = createServer(db);

      if (fs.existsSync(webDistPath)) {
        app.use(express.static(webDistPath));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(path.join(webDistPath, 'index.html'));
        });
      }

      const parsedPort = Number.parseInt(options.port ?? '3000', 10);
      if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
        throw new Error('Port must be a positive integer');
      }

      const server = app.listen(parsedPort, () => {
        const url = `http://localhost:${parsedPort}`;
        console.log(`taskos web UI running at ${url}`);
        if (options.open) {
          openBrowser(url);
        }
      });

      server.on('error', (error: Error) => {
        console.error(error instanceof Error ? error.message : String(error));
      });
    });
}
