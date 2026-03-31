import express from 'express';
import cors from 'cors';
import type { DatabaseSync } from 'node:sqlite';
import { createApiRouter } from './routes.js';

export function createServer(db: DatabaseSync) {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createApiRouter(db));
  return app;
}
