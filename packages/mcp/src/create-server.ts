import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { allTools } from './tools.js';

export const SERVER_NAME = 'taiwan-payroll-mcp';
export const SERVER_VERSION = '1.4.1';

/**
 * 建立並註冊所有工具的 McpServer。stdio 與 Streamable HTTP 兩種傳輸共用同一份組裝，
 * 避免工具清單在不同入口漂移（曾漏註冊 employer-supplementary / withholding）。
 * 異質 tool 陣列迭代會丟失 config↔handler 的關聯型別 — 各 tool 於 tools.ts 定義處已各自檢查，此處放寬。
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });
  for (const tool of allTools) {
    server.registerTool(tool.name, tool.config as never, tool.handler as never);
  }
  return server;
}
