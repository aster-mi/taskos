import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    forks: {
      execArgv: ['--experimental-sqlite'],
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/cli.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});

