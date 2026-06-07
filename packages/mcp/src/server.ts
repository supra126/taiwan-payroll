import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { allTools } from './tools.js';

async function main(): Promise<void> {
  const server = new McpServer({ name: 'taiwan-payroll-mcp', version: '1.3.0' });

  // 從單一來源 allTools 註冊，避免手列漂移（曾漏註冊 employer-supplementary / withholding）。
  // 異質 tool 陣列迭代會丟失 config↔handler 的關聯型別 — 各 tool 於 tools.ts 定義處已各自檢查，此處放寬。
  for (const tool of allTools) {
    server.registerTool(tool.name, tool.config as never, tool.handler as never);
  }

  await server.connect(new StdioServerTransport());
}

main().catch((err) => {
  console.error('taiwan-payroll-mcp failed to start:', err);
  process.exit(1);
});
