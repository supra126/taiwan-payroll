import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '快速上手與資料來源 | taiwan-payroll',
  description: 'taiwan-payroll 安裝、用法、MCP server 設定，以及民國113–115（2024–2026）官方分級表來源與文號。',
};

const pre = 'mt-3 overflow-x-auto rounded-md border border-rule bg-ink px-4 py-3.5 text-sm leading-relaxed text-paper figures';

export default function Docs() {
  return (
    <article className="max-w-3xl">
      <p className="mb-8">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-cinnabar-deep hover:underline">
          ← 回首頁計算機
        </Link>
      </p>

      <h1 className="text-3xl font-bold text-ink">快速上手</h1>
      <pre className={pre}>
        <code>npm install taiwan-payroll</code>
      </pre>
      <pre className={pre}>
        <code>{`import { createPayrollEngine } from 'taiwan-payroll';
const engine = createPayrollEngine({ year: 2026 });
engine.calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
engine.calculateSupplementary({ type: 'bonus', amount: 200000, monthlyInsuredSalary: 42000 });
engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08' });`}</code>
      </pre>

      <h2 className="mt-12 text-xl font-bold text-ink">MCP server</h2>
      <p className="mt-3 text-ink-soft">於 MCP client（如 Claude Desktop）設定：</p>
      <pre className={pre}>
        <code>{`{
  "mcpServers": {
    "taiwan-payroll": { "command": "npx", "args": ["-y", "taiwan-payroll-mcp"] }
  }
}`}</code>
      </pre>

      <h2 className="mt-12 text-xl font-bold text-ink">資料來源與官方文號（民國115年／2026）</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-rule-strong text-left font-mono text-xs uppercase tracking-wider text-ink-faint">
              <th className="py-2.5 pr-4">項目</th>
              <th className="py-2.5 px-4">主管機關</th>
              <th className="py-2.5 px-4">文號／依據</th>
              <th className="py-2.5 pl-4 text-right">上限</th>
            </tr>
          </thead>
          <tbody className="text-ink-soft">
            {[
              ['勞保投保薪資分級表（11級）', '勞動部勞保局', '勞動保2字第1140091863號令', '45,800'],
              ['勞退月提繳分級表（62級）', '勞動部勞保局', '勞動福3字第1140153598號令', '150,000'],
              ['職災投保薪資分級表（21級）', '勞動部勞保局', '職災保險法§17', '72,800'],
              ['健保投保金額分級表（58級）', '衛福部健保署', '衛部保字第1140153424號令', '313,000'],
            ].map((row) => (
              <tr key={row[0]} className="border-b border-rule/70">
                <td className="py-2.5 pr-4 text-ink">{row[0]}</td>
                <td className="py-2.5 px-4">{row[1]}</td>
                <td className="py-2.5 px-4">{row[2]}</td>
                <td className="py-2.5 pl-4 text-right figures">{row[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-ink-faint">
        亦內建民國 113（2024）、114（2025）年度；上方為最新年度（115／2026）。各年度完整分級表與發布文號見原始碼 <code className="figures">data/{'{year}'}.json</code> 的 <code>sources</code>，計算機右上可切換年度。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">免責聲明</h2>
      <p className="mt-3 leading-relaxed text-ink-soft">
        本套件依公開法規與主管機關公告實作，計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
      </p>
    </article>
  );
}
