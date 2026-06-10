import Link from 'next/link';
import type { Metadata } from 'next';

const DESC =
  '把 taiwan-payroll MCP server 接上 Claude、Cursor 等支援 MCP 的 AI 助理，直接用自然語言問勞健保、勞退、二代健保補充保費、薪資扣繳與勞保老年給付，由官方驗證的計算引擎即時算出。提供遠端 Streamable HTTP（免安裝）與本地 stdio 兩種連線方式。';

export const metadata: Metadata = {
  title: '在 AI 助理裡算薪資（MCP server）',
  alternates: { canonical: '/mcp' },
  description: DESC,
  keywords: [
    'MCP server', 'taiwan-payroll MCP', '台灣薪資 MCP', 'Claude 算薪資', 'Cursor MCP',
    'AI 勞健保計算', 'Model Context Protocol 台灣', 'AI 算勞退',
  ],
  openGraph: { title: '在 AI 助理裡算薪資｜台灣勞健保勞退 MCP server', description: DESC, url: '/mcp', type: 'article' },
  twitter: { title: '在 AI 助理裡算薪資｜台灣勞健保勞退 MCP server', description: DESC },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: '首頁', item: 'https://taiwan-payroll.vercel.app' },
    { '@type': 'ListItem', position: 2, name: '在 AI 助理裡算薪資', item: 'https://taiwan-payroll.vercel.app/mcp' },
  ],
};

const REMOTE = 'https://taiwan-payroll.simoko.workers.dev/mcp';

const pre = 'mt-3 overflow-x-auto rounded-md border border-rule bg-ink px-4 py-3.5 text-sm leading-relaxed text-paper figures';
const lang = 'mt-8 font-mono text-xs uppercase tracking-wider text-ink-faint';
const h2 = 'mt-14 text-2xl font-bold text-ink';

const tools: [string, string][] = [
  ['calculate_payroll', '勞保＋健保＋勞退＋職災各方負擔'],
  ['calculate_supplementary_premium', '二代健保補充保費（六類所得）'],
  ['calculate_employer_supplementary_premium', '雇主端二代健保補充保費'],
  ['calculate_income_tax_withholding', '薪資所得稅扣繳'],
  ['calculate_old_age_pension', '勞保老年年金（月領，擇優兩式）'],
  ['calculate_old_age_lump_sum', '勞保老年一次金'],
  ['calculate_old_age_single_payment', '一次請領老年給付（舊制基數）'],
  ['calculate_prorated', '月中到職／離職破月（健保月底歸屬）'],
  ['list_years', '列出可用年度、資料版本、基本工資'],
];

export default function McpPage() {
  return (
    <article className="max-w-5xl [&_p]:max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <p className="mb-8">
        <Link href="/" className="font-mono text-xs uppercase tracking-widest text-cinnabar-deep hover:underline">
          ← 回首頁計算機
        </Link>
      </p>

      <h1 className="text-3xl font-bold text-ink">在你的 AI 助理裡算薪資</h1>
      <p className="mt-2 text-ink-soft">
        把 <strong>taiwan-payroll</strong> 的 MCP（Model Context Protocol）server 接上 Claude、Cursor 等支援 MCP 的 AI 助理，
        就能用自然語言問勞健保、勞退、二代健保補充保費、薪資扣繳與勞保老年給付——由對官方範例逐位元驗證的同一套引擎即時算出。
      </p>

      <figure className="mt-8">
        <img
          src="/mcp-demo.gif"
          width={900}
          height={600}
          alt="在 AI 助理中以自然語言詢問薪資，taiwan-payroll MCP server 呼叫 calculate_payroll 即時算出員工自付 4,872、雇主負擔 8,315"
          className="w-full rounded-lg border border-rule"
        />
        <figcaption className="mt-2 text-center font-mono text-xs uppercase tracking-wider text-ink-faint">
          示意：在支援 MCP 的 AI 助理（Claude / Cursor 等）中呼叫 taiwan-payroll
        </figcaption>
      </figure>

      <h2 className={h2}>兩種連線方式</h2>
      <p className="mt-2 text-ink-soft">擇一即可。遠端端點免安裝、開箱即用；本地 stdio 則完全在你的機器上跑。</p>

      <p className={lang}>① 遠端 Streamable HTTP · 免安裝</p>
      <p className="mt-2 text-ink-soft">支援原生 remote MCP 的 client，直接填入端點 URL：</p>
      <pre className={pre}>
        <code>{REMOTE}</code>
      </pre>
      <pre className={pre}>
        <code>{`{
  "mcpServers": {
    "taiwan-payroll": {
      "type": "streamable-http",
      "url": "${REMOTE}"
    }
  }
}`}</code>
      </pre>
      <p className="mt-3 text-sm text-ink-soft">
        端點無狀態、無需登入；計算純在 edge 執行，<strong>不蒐集輸入資料</strong>。
      </p>

      <p className={lang}>② 本地 stdio · npx</p>
      <p className="mt-2 text-ink-soft">不想連遠端、想完全離線在本機跑，用 npx 啟動：</p>
      <pre className={pre}>
        <code>{`{
  "mcpServers": {
    "taiwan-payroll": {
      "command": "npx",
      "args": ["-y", "taiwan-payroll-mcp"]
    }
  }
}`}</code>
      </pre>

      <h2 className={h2}>各家 client 怎麼設定</h2>

      <p className={lang}>Claude Desktop</p>
      <p className="mt-2 text-ink-soft">
        編輯設定檔（macOS：<code className="font-mono text-sm">~/Library/Application Support/Claude/claude_desktop_config.json</code>），
        把上面任一段 <code className="font-mono text-sm">mcpServers</code> 貼進去後重啟。
      </p>

      <p className={lang}>Cursor</p>
      <p className="mt-2 text-ink-soft">
        於專案 <code className="font-mono text-sm">.cursor/mcp.json</code> 或全域 <code className="font-mono text-sm">~/.cursor/mcp.json</code> 加入相同的{' '}
        <code className="font-mono text-sm">mcpServers</code> 設定。
      </p>

      <p className={lang}>Smithery · 一鍵安裝</p>
      <p className="mt-2 text-ink-soft">
        透過第三方目錄一鍵安裝到支援的 client：{' '}
        <a
          href="https://smithery.ai/servers/supra126/taiwan-payroll"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-cinnabar-deep hover:underline"
        >
          smithery.ai/servers/supra126/taiwan-payroll
        </a>
        。
      </p>

      <p className={lang}>官方 MCP Registry</p>
      <p className="mt-2 text-ink-soft">
        已上架官方 Registry，條目 <code className="font-mono text-sm">io.github.supra126/taiwan-payroll</code>（遠端 streamable-http 與 npm stdio 雙軌）。
      </p>

      <h2 className={h2}>可用的工具</h2>
      <p className="mt-2 text-ink-soft">連線後 AI 助理可呼叫以下 9 個工具，皆為唯讀試算、不寫入任何資料：</p>
      <div className="mt-4 divide-y divide-rule border-y border-rule">
        {tools.map(([name, desc]) => (
          <div key={name} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] sm:gap-4">
            <code className="font-mono text-sm text-cinnabar-deep">{name}</code>
            <span className="text-ink-soft">{desc}</span>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm leading-relaxed text-ink-faint">
        試算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準，不構成法律或會計建議。
        函數層級的完整參數與回傳結構見{' '}
        <Link href="/docs/api" className="font-semibold text-cinnabar-deep hover:underline">
          API 參考
        </Link>
        。
      </p>
    </article>
  );
}
