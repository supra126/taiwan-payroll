import { handleMcpRequest } from './http.js';
import { SERVER_NAME, SERVER_VERSION } from './create-server.js';

// 公開無狀態端點，允許任意來源連線（含瀏覽器型 MCP client）。
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(data: unknown, status = 200): Response {
  return withCors(
    new Response(JSON.stringify(data, null, 2), {
      status,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    }),
  );
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));

    if (url.pathname === '/mcp') {
      // 任何錯誤都要回 JSON（已套 CORS）；否則拋出會讓 runtime 回 500 但無 CORS 標頭，
      // 瀏覽器型 client 只會看到 CORS error 而非真正原因。
      try {
        return withCors(await handleMcpRequest(request));
      } catch (err) {
        return json({ error: 'Internal Server Error', detail: String(err) }, 500);
      }
    }

    // 給人類／健康檢查用的說明頁
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: '台灣勞健保勞退計算 MCP server（無狀態 Streamable HTTP）。',
        endpoint: `${url.origin}/mcp`,
        transport: 'streamable-http',
        docs: 'https://taiwan-payroll.vercel.app',
        disclaimer: '計算結果僅供參考，以勞保局、健保署核發之繳款單為準，不構成法律或會計建議。',
      });
    }

    return json({ error: 'Not found', hint: 'MCP endpoint 在 /mcp' }, 404);
  },
};
