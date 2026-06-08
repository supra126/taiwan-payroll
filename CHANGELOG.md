# Changelog

本專案的所有重大變更記錄於此。格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

涵蓋套件：`taiwan-payroll`（npm，計算引擎 core）、`taiwan-payroll-mcp`（npm，MCP server）、`taiwan-payroll`（PyPI，Python 實作）、`@taiwan-payroll/docs`（文件站，未發佈）。

---

## [Unreleased]

### Added

- **`taiwan-payroll-mcp` 1.4.0 — 遠端傳輸**：新增無狀態 Streamable HTTP handler（`http.ts`，Web 標準 `Request`→`Response`）與 Cloudflare Worker 進入點（`worker.ts`），可部署為公開遠端 MCP server；stdio 與 HTTP 共用同一份 `create-server.ts` 組裝，工具清單不漂移。**計算邏輯與 9 個 tool 皆不變**，純 mcp 套件變更。

### Fixed

- **整數 NTD 契約跨語言對齊（core）**：TS 端對小數金額輸入改為先 `Math.floor` 取整再計算（補充保費 `chargeable`、雇主補充保費 `base`、扣繳 `taxable`/獎金/非居住者月薪、老年給付平均投保薪資、`calcDividendPremium` base），與 Python 端既有 `int()` 契約**逐位元一致**。先前小數輸入兩語言會在進位邊界差 1 元（如 dividend 20,023.7 → 422 vs 423）；整數輸入結果不變。
- **`calculateProrated`**：同月份 `startDate` 晚於 `endDate` 時明確丟錯（原會回傳異常天數）。TS≡Python。
- **`generateSupplementaryBonusFiling`**：年度累計獎金 `ytdBonusCumulative` 小於本筆 `bonusAmount` 時丟錯（避免下游 `ytdBonus` 變負數）。TS≡Python。

## [1.3.0] - 2026-06-08

新增「勞保老年給付試算」——引擎從「算扣項／產申報檔」延伸到「算給付」。三套件同步發佈 1.3.0（`taiwan-payroll-mcp` 自 1.1.0 跳升至 1.3.0，納入本版新增的 3 個老年給付 tool 與漏註冊修正）。

### Added

- **勞保老年給付試算（3 種，core / Python / MCP）**，皆以勞保局官方試算數值/公式驗證，整數運算、TS≡Python：
  - `calculateOldAgePension`（老年年金月領）：擇優兩式（`平均×年資×0.775%+3000`、`×1.55%`），提前/延後請領 `claimOffsetMonths`（每年 ±4%，上限 ±5 年（±20%）），年資未滿 15 年 `eligible:false`。便利函式 `averageHighestInsuredSalary`、`statutoryClaimAge`。
  - `calculateOldAgeLumpSum`（老年一次金）：`平均 × 給付月數`（年資每滿 1 年 1 個月、逾 60 歲後年資最多 5 年）。
  - `calculateOldAgeSinglePayment`（一次請領老年給付，舊制基數）：前 15 年每年 1 基數、超過部分每年 2 基數、滿 60 歲前最高 45 基數、逾 60 歲後合併最高 50 基數；平均採退保前 36 個月。
- `data/{year}.json` 新增 `oldAgePension` 區段（法定參數，目前 2026）。
- MCP 新增 tools `calculate_old_age_pension`、`calculate_old_age_lump_sum`、`calculate_old_age_single_payment`。
- 文件站 `/docs/api` 新增上述段落。

### Fixed

- **MCP server 漏註冊 tool**：`server.ts` 原為手列註冊，自 1.1.0 起未註冊 `calculate_employer_supplementary_premium` 與 `calculate_income_tax_withholding`（兩 tool 已在程式內但 stdio server 未暴露）。改為自單一來源 `allTools` 迭代註冊，杜絕漂移；本版起 9 個 tool 全部可用。

### Notes

- 勞退新制專戶累積試算（B）暫不納入（為多假設 what-if 投影、最複雜，官方演算法已逆推保存待未來實作）。

## [1.2.0] - 2026-06-08

新增「健保二代補充保費明細申報檔（CSV）產生器」——將引擎從「算扣項」延伸到「產申報檔」。本版僅 `taiwan-payroll`（npm core）與 `taiwan-payroll`（PyPI）發佈；`taiwan-payroll-mcp` 無變更，維持 1.1.0（媒體檔產生器刻意不做為 MCP tool，MCP 聚焦計算）。

### Added

- **健保補充保費明細申報檔產生器（6 類所得，CSV／Big5）**（core / Python）：依健保署官方格式產生扣費單位申報檔，並以官方範例**逐位元驗證**（TS≡Python）。
  - `generateSupplementaryBonusFiling`（獎金，類別 62）
  - `generateSupplementaryParttimeFiling`（兼職薪資，類別 63）
  - `generateSupplementaryProfessionalFiling`（執行業務，類別 65）
  - `generateSupplementaryDividendFiling`（股利，類別 66）
  - `generateSupplementaryInterestFiling`（利息，類別 67）
  - `generateSupplementaryRentFiling`（租金，類別 68）
  - 各函式回傳 `{ filename, content }`；`content` 為 Unicode 字串（檔案實際為 **Big5**：Python 以 `to_big5_bytes()` 取位元組，TS 端由呼叫端以 Big5 編碼寫出，core 維持零依賴）。獎金/兼職/執行業務/利息/租金 的逐列補充保費由 `calculateSupplementary` 計算；股利因含股票股利／雇主扣除等情形，逐列保費由呼叫端提供。
- **`calculateDividendPremium`**（TS `calcDividendPremium` / Python `calc_dividend_premium`）：股利補充保費便利函式（一般股東 `單次給付×費率`、雇主 `(單次給付−投保額總額)×費率`，單次達 2 萬起扣）。
- 文件站 `/docs/api`：新增上述各產生器段落。

### Notes

- 媒體檔產生「資料檔」供使用者以官方入口上傳，不涉提交協定。
- 勞保局投保異動、財政部扣繳憑單等 Big5 固定欄寬媒體檔：因無公開可下載的官方範例可供逐位元驗證，暫不納入，待取得官方範例再實作。

## [1.1.0] - 2026-06-07

擴大「薪資扣項」涵蓋範圍：補上雇主端二代健保補充保費與薪資所得稅扣繳；型別改由 schema 自動生成；升級開發工具鏈。計算邏輯對既有 API 不變。

### Added

- **雇主端二代健保補充保費** `calculateEmployerSupplementary`（core / Python / MCP `calculate_employer_supplementary_premium`）：`(每月支付薪資總額 − 受僱者健保投保金額總額) × 2.11%`，無上限。
- **薪資所得扣繳** `calculateWithholding`（core / Python / MCP `calculate_income_tax_withholding`）：居住者固定月薪公式法（115 級距、兩步四捨五入）、居住者非每月給付獎金 5%（起扣 90,501）、非居住者 18%／月薪≤1.5×基本工資為 6%。`data/{year}.json` 新增 `incomeTax` 區段（目前提供 2026；其餘年度未提供時丟明確錯誤）。
- 文件站 `/docs/api`：新增上述兩方法段落（TS·Python 並列）。

### Changed

- **型別 codegen**：`packages/core` 的資料型別（`YearData`/`Bracket`/`Burden`/`IncomeTax`/`TaxBracket`）改由 `data/schema.json` 自動生成（`scripts/gen-types.ts` → `types.generated.ts`），根除手寫鏡像漂移；CI 加 `gen:types:check`。順帶補完 schema 既有缺漏（`supplementaryPremium` 的 `lowerThreshold`／`singlePaymentCap`、`YearData` 的 `sources`）。
- **開發工具鏈**：TypeScript 升 6.0；GitHub Actions 升 v6（Node 24 runtime）、CI build Node 20→24。pnpm 維持 10。

## [1.0.1] - 2026-06-05

維護性釋出，計算邏輯與資料不變。

### Added
- **Python（`taiwan-payroll` PyPI）**：`taiwan_payroll.__version__`，透過 `importlib.metadata` 讀取（`pyproject.toml` 為唯一版本來源）。

### Changed
- 發佈流程（`.github/workflows/publish.yml`）改用 **OIDC Trusted Publishing**，npm／PyPI 皆免 token。

---

## [1.0.0] - 2026-06-05

首個正式版本。完成 spec 規劃的 M1–M4 全部里程碑：以 `data/` 為單一事實來源、`testdata/` 為語言無關黃金測試向量，TypeScript 與 Python 兩語言實作對同一套 32 個向量逐位元一致。

> **定位是「計算引擎」而非「法遵保證」。** 計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。

### Added — 計算引擎（`taiwan-payroll` core, TypeScript）

**M1 — 基本計算**
- `createPayrollEngine({ year })` → `calculate(input)`：勞工保險（含就業保險）、全民健康保險（第 1 類）、勞工退休金的各方負擔明細。
- 級距查找（「介於兩級取較高級」）、整數精確的費率/進位運算（避免浮點誤差）。
- 健保**逐人四捨五入**（本人保費先進位再乘眷口數，眷屬上限 3 口）；勞保合併費率單次進位。
- 不參加就業保險（11.5%）、健保眷屬數、勞工自提（0–6%）。

**M2 — 職災、補充保費、破月、進位策略**
- 職業災害保險（雇主全額負擔，行業別費率可覆寫，預設平均 0.21%）。
- `calculateSupplementary(input)`：二代健保補充保費（費率 2.11%）六類所得——高額獎金（超過當月投保額 4 倍部分、年度累計）、兼職薪資、執行業務、股利、利息、租金（單次達門檻全額課、上限 1,000 萬）。
- `calculateProrated(input)`：月中到職/離職破月——勞保/職保/勞退**按日**（30 日基準）、健保採官方**月底歸屬原則**。
- 進位策略可設定：`round`（預設）、`ceil`、`aggregate-then-round`（政府方吸收進位差）。

**M4 — 部分工時、外籍身份**
- 部分工時：`partTime` 旗標——未達基本工資的部分工時者，勞保/健保對到官方低級距（而非 floor 到第 1 級）；職保官方歸 29,500、勞退本已涵蓋低薪。
- 外籍身份：`identity` 擴充 `migrantGeneral`（一般移工：勞保普通事故 11.5%、無就保/勞退）、`migrantDomestic`（家事移工：僅健保＋職災）；外籍配偶沿用 `category1`。不適用險種回傳 0。
- 輸入驗證：非有限/負薪資、眷屬數、自提、職災費率範圍 `[0, 0.02)`、日期格式、bonus 必填欄位等皆明確拋錯。

### Added — 資料（單一事實來源）
- `data/2026.json`（民國 115 年）、`data/2025.json`（民國 114 年）、`data/2024.json`（民國 113 年）：勞保、勞退、職保、健保四張分級表逐級取自官方公告 PDF/分級表，含發布文號於 `sources`。
- 部分工時低級距（`partTimeBrackets`，勞保/健保；113 為 15 級、114 為 16 級、115 為 17 級）。
- `data/schema.json` + `scripts/validate-data.ts`：JSON Schema、級距連續性、向量格式於 CI 驗證。

### Added — MCP server（`taiwan-payroll-mcp`）
- stdio MCP server，薄包裝 core（零計算邏輯）。4 個 tools：`calculate_payroll`、`calculate_supplementary_premium`、`calculate_prorated`、`list_years`。
- `@modelcontextprotocol/sdk` + zod 輸入 schema；core 語意驗證錯誤透傳為 `isError`。

### Added — 文件站與線上計算機（`apps/docs`）
- Next.js App Router 靜態匯出（吃 SEO），首頁三分頁線上計算機（月薪/補充保費/破月），client 端直接執行 core、無後端。
- `/docs` 快速上手、MCP 設定、資料來源與官方文號表、免責聲明。

### Added — Python 實作（`taiwan-payroll`, PyPI）
- 純 stdlib、零執行期依賴；忠實鏡像 TS 引擎（整數分數運算逐位元一致）。
- snake_case dataclass API：`create_payroll_engine(year)`、`CalculateInput`/`SupplementaryInput`/`ProratedInput`。
- `tests/test_vectors.py` 以通用 camelCase↔snake_case 轉換**跑通同一套 `testdata/` 向量**，與 TS 逐位元一致。

### Added — 文件與流程
- `scripts/annual-update.md`：年度更新 SOP（公告 → 抓官方資料 → 建 data → 驗證 → 補向量 → 兩語言 release）。
- 各套件 README 與免責聲明。

### Notes — 官方查證訂正
實作過程逐項查證官方來源，訂正了多處初版假設：
- 114 年健保分級表為 **59 級**（115 為 58 級；115 刪除 28,800 級）。
- 113 年健保分級表為 **50 級**（上限 219,500，114 才升至 313,000 並擴為 59 級）；113 基本工資 27,470，故同時保留 27,600 與 28,800 兩級（勞保 13 級、職保 23 級）。
- 113 年職災平均費率 **0.20%**（含通勤 0.07%，111.05.01～113.12.31 適用；114 起升 0.21%）。
- 113 年職災分級表令為 **勞動保3字**第1120077391號（與勞保表的「保2字」不同字軌，同日 112-10-16 發布）。
- 健保破月為**月底歸屬原則**（非 15 日分水嶺）。
- **職保部分工時歸第 1 級 29,500**（無低級距；勞保局 FAQ 0006920）。
- **外籍配偶就保/勞退皆適用**，計算上等同 `category1`。

### 架構
- `data/`（年度法規參數）與 `testdata/`（黃金測試向量）為語言無關資產；任何新語言實作的 Definition of Done＝載入 `data/` ＋ 通過 `testdata/` 全部向量。
- 跨語言 184 測試（TypeScript 128 + Python 56）。
- License：MIT。

[Unreleased]: https://github.com/supra126/taiwan-payroll/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.3.0
[1.2.0]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.2.0
[1.1.0]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.1.0
[1.0.1]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.0.1
[1.0.0]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.0.0
