import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  treeshake: true,
  // Inline the root data JSON into the bundle so the published package needs no file I/O.
  loader: { '.json': 'json' },
});
