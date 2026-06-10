# taiwan-payroll-mcp

台灣勞健保勞退計算的 MCP（Model Context Protocol）server。薄包裝 [`taiwan-payroll`](https://www.npmjs.com/package/taiwan-payroll) core，零計算邏輯。

<p align="center">
  <img src="https://raw.githubusercontent.com/supra126/taiwan-payroll/main/assets/mcp-demo.gif" alt="在 AI 助理中以自然語言詢問薪資，taiwan-payroll MCP server 呼叫 calculate_payroll 即時算出員工自付 4,872、雇主負擔 8,315" width="760">
  <br><sub>示意：在支援 MCP 的 AI 助理（Claude / Cursor 等）中呼叫 taiwan-payroll</sub>
</p>

<p align="center">
  <a href="https://glama.ai/mcp/servers/supra126/taiwan-payroll">
    <img src="https://glama.ai/mcp/servers/supra126/taiwan-payroll/badges/score.svg" alt="taiwan-payroll MCP server — Glama 品質評分">
  </a>
</p>

## Tools

| Tool | 功能 |
|---|---|
| `calculate_payroll` | 勞保＋健保＋勞退＋職災各方負擔 |
| `calculate_supplementary_premium` | 二代健保補充保費（六類所得） |
| `calculate_employer_supplementary_premium` | 雇主端二代健保補充保費 |
| `calculate_income_tax_withholding` | 薪資所得稅扣繳 |
| `calculate_old_age_pension` | 勞保老年年金（月領，擇優兩式） |
| `calculate_old_age_lump_sum` | 勞保老年一次金 |
| `calculate_old_age_single_payment` | 勞保一次請領老年給付（舊制基數） |
| `calculate_prorated` | 月中到職／離職破月（健保月底歸屬） |
| `list_years` | 列出可用年度、資料版本、基本工資 |

## 安裝與設定（MCP client）

兩種連線方式，擇一即可。

### 1. 本地 stdio（npx，免部署）

於 MCP client（如 Claude Desktop）的設定加入：

```json
{
  "mcpServers": {
    "taiwan-payroll": {
      "command": "npx",
      "args": ["-y", "taiwan-payroll-mcp"]
    }
  }
}
```

### 2. 遠端 Streamable HTTP（免安裝）

公開無狀態端點，支援原生 remote MCP 的 client 可直接填 URL：

```json
{
  "mcpServers": {
    "taiwan-payroll": {
      "type": "streamable-http",
      "url": "https://taiwan-payroll.simoko.workers.dev/mcp"
    }
  }
}
```

> 此端點無狀態、無需登入；計算純在 edge 執行，不蒐集輸入資料。

## 自行部署（Cloudflare Workers）

```bash
pnpm --filter taiwan-payroll-mcp deploy   # wrangler deploy
```

`src/worker.ts` 為 Cloudflare Worker 進入點，沿用與 stdio 版相同的工具集（`src/create-server.ts`）。本地預覽：`pnpm --filter taiwan-payroll-mcp dev:http`。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
