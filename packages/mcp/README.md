# taiwan-payroll-mcp

台灣勞健保勞退計算的 MCP（Model Context Protocol）server。薄包裝 [`taiwan-payroll`](https://www.npmjs.com/package/taiwan-payroll) core，零計算邏輯。

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

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。本套件不構成法律或會計建議。
