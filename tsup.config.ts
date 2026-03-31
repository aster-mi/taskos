import fs from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  platform: 'node',
  external: ['node:sqlite'],
  async onSuccess() {
    // esbuild strips the "node:" prefix from node:sqlite; restore it
    const outFile = 'dist/cli.js';
    const content = fs.readFileSync(outFile, 'utf8');
    const fixed = content.replaceAll('"sqlite"', '"node:sqlite"');
    if (fixed !== content) {
      fs.writeFileSync(outFile, fixed, 'utf8');
      console.log('Fixed node:sqlite import in dist/cli.js');
    }
  },
});
