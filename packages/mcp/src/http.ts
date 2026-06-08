import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createServer } from './create-server.js';

/**
 * 無狀態 Streamable HTTP handler（Web 標準 Request→Response），可跑在
 * Cloudflare Workers / Deno / Bun / Node 18+ 等任何支援 Web 標準的 runtime。
 *
 * 無狀態模式：不給 sessionIdGenerator、開 enableJsonResponse（POST 直接回單一 JSON，不開 SSE 串流）。
 * SDK 規定 stateless transport 不可跨請求重用，故每個請求建立全新的 server+transport——
 * 工具皆為純計算、無副作用，per-request 建立成本極低且為真正無狀態。
 */
export async function handleMcpRequest(request: Request): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await createServer().connect(transport);
  return transport.handleRequest(request);
}
