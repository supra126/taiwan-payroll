import { defineConfig } from 'vitest/config';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { 'taiwan-payroll': resolve(here, '../../packages/core/src/index.ts') } },
  test: { include: ['lib/**/*.test.ts'] },
});
