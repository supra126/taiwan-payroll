import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { calculatePayrollTool, supplementaryTool, proratedTool, listYearsTool } from './tools.js';

async function main(): Promise<void> {
  const server = new McpServer({ name: 'taiwan-payroll-mcp', version: '1.0.0' });

  // Register each tool explicitly so the SDK keeps per-tool inputSchema ↔ handler type inference.
  server.registerTool(calculatePayrollTool.name, calculatePayrollTool.config, calculatePayrollTool.handler);
  server.registerTool(supplementaryTool.name, supplementaryTool.config, supplementaryTool.handler);
  server.registerTool(proratedTool.name, proratedTool.config, proratedTool.handler);
  server.registerTool(listYearsTool.name, listYearsTool.config, listYearsTool.handler);

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('taiwan-payroll-mcp failed to start:', err);
  process.exit(1);
});
