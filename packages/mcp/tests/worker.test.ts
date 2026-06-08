import { describe, it, expect } from 'vitest';
import worker from '../src/worker';
import { SERVER_NAME } from '../src/create-server';

function call(method: string, path: string, body?: unknown): Promise<Response> {
  return worker.fetch(
    new Request(`https://taiwan-payroll.example.workers.dev${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }),
  );
}

describe('Cloudflare Worker fetch entrypoint', () => {
  it('answers CORS preflight (OPTIONS) with 204 and the allow-origin header', async () => {
    const res = await call('OPTIONS', '/mcp');
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('serves a health/landing JSON on / and /health, carrying CORS', async () => {
    for (const path of ['/', '/health']) {
      const res = await call('GET', path);
      expect(res.status).toBe(200);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
      const j = await res.json();
      expect(j.name).toBe(SERVER_NAME);
      expect(j.endpoint).toMatch(/\/mcp$/);
    }
  });

  it('returns a 404 JSON (with CORS) for unknown paths', async () => {
    const res = await call('GET', '/nope');
    expect(res.status).toBe(404);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect((await res.json()).error).toBe('Not found');
  });

  it('routes POST /mcp through the MCP handler and applies CORS to the response', async () => {
    const res = await call('POST', '/mcp', { jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    const text = await res.text();
    expect(text).toContain('calculate_payroll');
  });
});
