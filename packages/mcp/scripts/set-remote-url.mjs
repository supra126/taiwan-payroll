// 把部署後的 Worker URL 寫進 server.json 的 remotes[0].url。
// 用法：pnpm --filter taiwan-payroll-mcp set-url https://taiwan-payroll-mcp.<你的subdomain>.workers.dev/mcp
import { readFileSync, writeFileSync } from 'node:fs';

const url = process.argv[2];
if (!url || !/^https:\/\/.+\/mcp$/.test(url)) {
  console.error('用法: pnpm --filter taiwan-payroll-mcp set-url https://<your>.workers.dev/mcp');
  process.exit(1);
}

const file = new URL('../server.json', import.meta.url);
const json = JSON.parse(readFileSync(file, 'utf8'));
json.remotes[0].url = url;
writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
console.log('已更新 server.json 的 remote URL →', url);
