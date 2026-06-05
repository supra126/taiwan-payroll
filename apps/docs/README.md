# @taiwan-payroll/docs

台灣勞健保勞退試算的文件站與線上計算機（Next.js 靜態站）。計算全在瀏覽器執行 `taiwan-payroll` core，無後端。

## 開發

```bash
pnpm --filter @taiwan-payroll/docs dev      # 開發
pnpm --filter @taiwan-payroll/docs build    # 靜態匯出到 out/
pnpm --filter @taiwan-payroll/docs test     # lib 單元測試
pnpm --filter @taiwan-payroll/docs e2e      # Playwright 首頁計算 smoke（需先 build）
```

## 部署

`pnpm build` 產出純靜態 `out/`，可部署至任何靜態主機或 Vercel。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。
