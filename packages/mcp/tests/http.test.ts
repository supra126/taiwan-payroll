import { describe, it, expect } from 'vitest';
import { handleMcpRequest } from '../src/http';
import { allTools } from '../src/tools';

function mcpPost(body: unknown): Request {
  return new Request('http://localhost/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify(body),
  });
}

/** 解析回應：無狀態下 enableJsonResponse 回 application/json；保險也支援 SSE framing。 */
async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  if (res.headers.get('content-type')?.includes('application/json')) return JSON.parse(text);
  const line = text.split('\n').find((l) => l.startsWith('data:'));
  return line ? JSON.parse(line.slice(5).trim()) : JSON.parse(text);
}

// 真無狀態：每個請求互相獨立（各自一個 server+transport），不依賴前一個請求的狀態。
describe('streamable HTTP handler (stateless)', () => {
  it('responds to initialize with serverInfo', async () => {
    const res = await handleMcpRequest(
      mcpPost({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } },
      }),
    );
    expect(res.status).toBe(200);
    const j = await readJson(res);
    expect(j.result.serverInfo.name).toBe('taiwan-payroll-mcp');
  });

  it('lists all tools', async () => {
    const res = await handleMcpRequest(mcpPost({ jsonrpc: '2.0', id: 2, method: 'tools/list' }));
    const j = await readJson(res);
    expect(j.result.tools).toHaveLength(allTools.length);
    expect(j.result.tools.map((t: { name: string }) => t.name)).toContain('calculate_payroll');
  });

  it('runs calculate_payroll and returns the totals', async () => {
    const res = await handleMcpRequest(
      mcpPost({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'calculate_payroll', arguments: { monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 } },
      }),
    );
    const j = await readJson(res);
    expect(j.result.isError).toBeFalsy();
    expect(JSON.stringify(j.result)).toContain('員工自付合計');
  });
});
