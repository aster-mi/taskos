import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    forks: {
      execArgv: ['--experimental-sqlite'],
    },
  },
});
