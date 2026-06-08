import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './create-server.js';

async function main(): Promise<void> {
  await createServer().connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('taiwan-payroll-mcp failed to start:', err);
  process.exit(1);
});
