import Link from 'next/link';
import type { Metadata } from 'next';

const DESC =
  'taiwan-payroll 安裝與用法（TypeScript／Python）、MCP server 設定，以及勞保、勞退、職災、健保分級表的官方文號與資料來源（民國113–115／2024–2026）。';

export const metadata: Metadata = {
  title: '快速上手與資料來源',
  alternates: { canonical: '/docs' },
  description: DESC,
  openGraph: { title: '快速上手與資料來源｜台灣勞健保勞退試算', description: DESC, url: '/docs', type: 'article' },
  twitter: { title: '快速上手與資料來源｜台灣勞健保勞退試算', description: DESC },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://taiwan-payroll.vercel.app' },
    { '@type': 'ListItem', position: 2, name: '快速上手與資料來源', item: 'https://taiwan-payroll.vercel.app/docs' },
  ],
};

const pre = 'mt-3 overflow-x-auto rounded-md border border-rule bg-ink px-4 py-3.5 text-sm leading-relaxed text-paper figures';
const lang = 'mt-8 font-mono text-xs uppercase tracking-wider text-ink-faint';
const srcCols = 'sm:grid sm:grid-cols-[1.5fr_0.8fr_1.7fr_auto] sm:gap-4';
const srcLabel = 'w-9 shrink-0 font-mono text-[0.65rem] uppercase leading-5 tracking-wider text-ink-faint sm:hidden';

export default function Docs() {
  return (
    <article className="max-w-5xl [&_p]:max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <p className="mb-8">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-cinnabar-deep hover:underline">
          ← 回首頁計算機
        </Link>
      </p>

      <h1 className="text-3xl font-bold text-ink">快速上手</h1>
      <p className="mt-2 text-ink-soft">
        TypeScript（npm）與 Python（PyPI）為同一套引擎的鏡像，API 對應、計算結果逐位元一致。擇一語言即可。
      </p>

      <p className={lang}>TypeScript · npm</p>
      <pre className={pre}>
        <code>npm install taiwan-payroll</code>
      </pre>
      <pre className={pre}>
        <code>{`import { createPayrollEngine } from 'taiwan-payroll';
const engine = createPayrollEngine({ year: 2026 });
engine.calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
engine.calculateSupplementary({ type: 'bonus', amount: 200000, monthlyInsuredSalary: 42000 });
engine.calculateWithholding({ type: 'resident', monthlySalary: 100000, dependents: 2 });
engine.calculateOldAgePension({ avgInsuredSalary: 32000, years: 35, months: 6 });
engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08' });`}</code>
      </pre>

      <p className={lang}>Python · PyPI</p>
      <pre className={pre}>
        <code>pip install taiwan-payroll</code>
      </pre>
      <pre className={pre}>
        <code>{`from taiwan_payroll import (
    create_payroll_engine, CalculateInput, SupplementaryInput,
    WithholdingInput, ProratedInput, OldAgePensionInput,
    get_year_data, calc_old_age_pension,
)

engine = create_payroll_engine(year=2026)
engine.calculate(CalculateInput(monthly_salary=42000, dependents=1, pension_self_contribution=0.06))
engine.calculate_supplementary(SupplementaryInput(type="bonus", amount=200000, monthly_insured_salary=42000))
engine.calculate_withholding(WithholdingInput(type="resident", monthly_salary=100000, dependents=2))
engine.calculate_prorated(ProratedInput(monthly_salary=29500, start_date="2026-03-08"))
calc_old_age_pension(get_year_data(2026), OldAgePensionInput(avg_insured_salary=32000, years=35, months=6))`}</code>
      </pre>
      <p className="mt-4 text-ink-soft">
        涵蓋功能：勞健保勞退職災負擔、二代健保補充保費（含雇主端）、薪資所得稅扣繳、月中到職／離職破月、
        <strong>健保補充保費明細申報媒體檔產生</strong>（6 類所得，CSV／Big5）、
        <strong>勞保老年給付試算</strong>（年金月領／老年一次金／一次請領）。各函數的參數、預設值、範圍與回傳結構（TypeScript 與 Python 並列）見{' '}
        <Link href="/docs/api" className="font-semibold text-cinnabar-deep hover:underline">
          API 參考
        </Link>
        。
      </p>

      <h2 className="mt-12 text-xl font-bold text-ink">MCP server</h2>
      <p className="mt-3 text-ink-soft">
        讓 Claude 等 AI 助理直接呼叫試算。兩種連線方式擇一，於 MCP client（如 Claude Desktop）設定加入：
      </p>

      <p className={lang}>遠端 · 免安裝</p>
      <pre className={pre}>
        <code>{`{
  "mcpServers": {
    "taiwan-payroll": {
      "type": "streamable-http",
      "url": "https://taiwan-payroll.simoko.workers.dev/mcp"
    }
  }
}`}</code>
      </pre>
      <p className="mt-2 text-sm text-ink-faint">公開無狀態端點，無需登入；計算純在 edge 執行，不蒐集輸入資料。</p>

      <p className={lang}>本地 · npx（stdio）</p>
      <pre className={pre}>
        <code>{`{
  "mcpServers": {
    "taiwan-payroll": { "command": "npx", "args": ["-y", "taiwan-payroll-mcp"] }
  }
}`}</code>
      </pre>

      <h2 className="mt-12 text-xl font-bold text-ink">資料來源與官方文號（民國115年／2026）</h2>
      {/* 桌機四欄表格；手機改為堆疊（避免欄位被擠成直式單字） */}
      <div className="mt-4">
        <div className={`hidden border-b-2 border-rule-strong text-left font-mono text-xs uppercase tracking-wider text-ink-faint ${srcCols}`}>
          <div className="pb-2.5">項目</div>
          <div className="pb-2.5">主管機關</div>
          <div className="pb-2.5">文號／依據</div>
          <div className="pb-2.5 sm:text-right">上限</div>
        </div>
        {[
          ['勞保投保薪資分級表（11級）', '勞動部勞保局', '勞動保2字第1140091863號令', '45,800'],
          ['勞退月提繳分級表（62級）', '勞動部勞保局', '勞動福3字第1140153598號令', '150,000'],
          ['職災投保薪資分級表（21級）', '勞動部勞保局', '職災保險法§17', '72,800'],
          ['健保投保金額分級表（58級）', '衛福部健保署', '衛部保字第1140153424號令', '313,000'],
        ].map((row) => (
          <div key={row[0]} className={`border-b border-rule/70 py-3 text-sm text-ink-soft sm:items-baseline sm:py-2.5 ${srcCols}`}>
            <div className="font-medium text-ink sm:font-normal">{row[0]}</div>
            <div className="mt-1.5 flex gap-2 sm:mt-0 sm:block">
              <span className={srcLabel}>機關</span>
              <span>{row[1]}</span>
            </div>
            <div className="mt-1.5 flex gap-2 sm:mt-0 sm:block">
              <span className={srcLabel}>文號</span>
              <span>{row[2]}</span>
            </div>
            <div className="mt-1.5 flex gap-2 sm:mt-0 sm:block sm:text-right">
              <span className={srcLabel}>上限</span>
              <span className="figures">{row[3]}</span>
            </div>
          </div>
        ))}
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
