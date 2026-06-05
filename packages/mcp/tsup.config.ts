import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  clean: true,
  // taiwan-payroll, sdk, zod are runtime dependencies resolved from node_modules.
  external: ['@modelcontextprotocol/sdk', 'taiwan-payroll', 'zod'],
  banner: { js: '#!/usr/bin/env node' },
});
