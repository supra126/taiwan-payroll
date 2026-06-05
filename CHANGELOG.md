# Changelog

本專案的所有重大變更記錄於此。格式依循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.1.0/)，版本遵循 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

涵蓋套件：`taiwan-payroll`（npm，計算引擎 core）、`taiwan-payroll-mcp`（npm，MCP server）、`taiwan-payroll`（PyPI，Python 實作）、`@taiwan-payroll/docs`（文件站，未發佈）。

---

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

[1.0.0]: https://github.com/supra126/taiwan-payroll/releases/tag/v1.0.0
