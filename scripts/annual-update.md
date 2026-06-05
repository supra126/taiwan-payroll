# 年度更新 SOP（Annual Update Standard Operating Procedure）

> 每年政府公告次年級距／費率後，更新 `data/{year}.json`、補測試向量、TS 與 Python 兩語言一起發版的標準流程。
>
> **核心原則：所有級距與費率逐級從主管機關官方公告取得，不可使用記憶中的數字，也不可從前一年度「改底改頂」衍生（級數逐年會變）。** 每個數字都要能溯源到 `sources` 的文號／網址。

---

## 0. 時機與來源

- **觸發時機**：勞動部與衛福部健保署通常於每年 **11–12 月** 公告次年 1 月 1 日生效的分級表（配合基本工資調整）。最低工資由勞動部基本工資審議委員會先決議。
- **四張表＋兩個費率**：

  | 項目 | 主管機關 | 官方來源 |
  |---|---|---|
  | 勞工保險投保薪資分級表 | 勞動部勞保局 | `https://www.bli.gov.tw/0005475.html` |
  | 勞工退休金月提繳分級表 | 勞動部勞保局 | `https://www.bli.gov.tw/0013083.html` |
  | 勞工職業災害保險投保薪資分級表 | 勞動部勞保局 | 災保專區／法規 `laws.mol.gov.tw` FL098312 |
  | 全民健康保險投保金額分級表 | 衛福部健保署 | `https://www.nhi.gov.tw/ch/cp-19421-f9533-2569-1.html` |
  | 職災平均費率 | 勞動部 | `https://www.mol.gov.tw/1607/1632/1633/...`（年度公告） |
  | 二代健保補充保費費率 | 健保署 | `https://www.nhi.gov.tw/ch/cp-4516-74b0f-2613-1.html` |

  資料取得的繞法細節另見記憶 `sourcing-official-bracket-tables`。

---

## 1. 抓官方資料（含繞法）

### 1.1 勞保局四表（勞保 / 勞退 / 職保）— 官方 PDF
勞保局網站會擋自動存取，但附件以 `/Files/{id}` 提供，可直接下載 PDF 後用 `pdftotext -layout` 解析（最權威，含發布文號）：

```bash
cd /tmp
# 1) 抓清單頁，找出「{民國年}年1月1日起適用」對應的 /Files/{id}
curl -sL "https://www.bli.gov.tw/0005475.html" -A "Mozilla/5.0" -o bli_labor.html
python3 - <<'PY'
import re
html=open('bli_labor.html',encoding='utf-8',errors='ignore').read()
for m in re.finditer(r'/Files/(\d+)', html):
    seg=re.sub(r'<[^>]+>',' ',html[max(0,m.start()-300):m.end()+200])
    seg=re.sub(r'\s+',' ',seg)
    if '年1月1日起適用' in seg or '生效' in seg:
        print(m.group(1), '::', seg[-120:])
PY
# 2) 下載對應 PDF（最新年度在最上面）並解析
curl -sL "https://www.bli.gov.tw/Files/{ID}" -A "Mozilla/5.0" -o labor.pdf
pdftotext -layout labor.pdf - | cat
```
- 勞保分級表頁 `0005475.html`、勞退月提繳頁 `0013083.html`、職保見災保專區或法規 `FL098312`。
- PDF 第一行通常含發布文號（如「勞動部勞動保2字第◯◯◯號令」），抄入 `sources[].document`。

### 1.2 健保署 / 職保 — 官網擋 curl/WebFetch
健保署與部分職保頁面對 `curl`／`WebFetch` 回 403／截斷。改用 **Workforce 勞動力量** 的完整轉錄頁（`twworkforce.com`），用 `Mozilla` UA `curl` 後以 Python 解析 `<table>`：

```bash
# 健保（健保署每年約 12 月公告次年）
curl -sL "https://twworkforce.com/{yyyy}/12/.../{yyyy+1}-nhi/" -A "Mozilla/5.0 (Macintosh)" -o nhi.html
python3 - <<'PY'
import re
h=open('nhi.html',encoding='utf-8',errors='ignore').read()
for t in re.findall(r'<table.*?</table>',h,re.S):
    txt=re.sub(r'<[^>]+>',' ',t)
    if '投保金額' in txt and '313,000' in txt:   # 上限隨年度調整，必要時改條件
        rows=re.findall(r'<tr.*?</tr>',t,re.S)
        for r in rows:
            cells=[re.sub(r'\s+','',re.sub(r'<[^>]+>','',c)) for c in re.findall(r'<t[dh].*?</t[dh]>',r,re.S)]
            nums=[int(c.replace(',','')) for c in cells if re.fullmatch(r'[\d,]{4,7}',c)]
            if len(nums)==1: print(nums[0])
        break
PY
```
也同時抓官方「保險費負擔金額表」——它的本人／眷屬／投保單位金額是建測試向量的最佳來源（見步驟 4）。

### 1.3 交叉驗證（必做）
- **公式錨點**：勞保最低級自付＝`級距×12.5%×20%`；健保本人＝`round(級距×5.17%×30%)`；職災＝`round(級距×平均費率)`。手算 1–2 個級距比對官方負擔表。
- **結構檢查**：健保「第 38 級以下比照勞退分級表」；職保與勞保下段級距相同。
- **WebFetch 注意**：長表（健保 58/59 級、勞退 62 級）會被小模型截斷——一律自行 `curl` + Python 解析，勿信 WebFetch 的長表摘要。

---

## 2. 建 `data/{year}.json`

用產生器把每張表的「月投保／提繳金額」陣列轉成級距（`min = 前一級 insured + 1`、`max = 該級 insured`、頂級 `max = null`），避免手抄錯誤：

```python
def brackets(insured):
    out=[]; prev=0; n=len(insured)
    for i,v in enumerate(insured):
        out.append({"grade":i+1,"min":0 if i==0 else prev+1,
                    "max":None if i==n-1 else v,"insuredSalary":v}); prev=v
    return out
# labor/occ/pension/health 各自一個 insured 陣列；assert 級數與上限符合官方
```

必填欄位（依 `data/schema.json` 的 `required`）：`year`、`effectiveDate`、`dataVersion`、`sources[]`（含 `document` 文號）、`minimumWage`、`laborInsurance`／`occupationalInsurance`／`healthInsurance`／`pension`／`supplementaryPremium`（費率為**字串**、金額為**整數**）。另慣例帶入 `rocYear`（民國年，非 schema 必填但既有檔皆有）。比照既有 `data/2026.json`、`data/2025.json` 的結構。

**`dataVersion` 規則**：`{民國年或西元年}.{公告序}.{修訂}`，如 `2026.1.0`（2026 年度第 1 次公告版）。

### 2.1 註冊年度
- **TS**：在 `packages/core/src/data.ts` 的 `registry` 加 `import data{year} from '../../../data/{year}.json'` 與一筆對應。
- **Python**：`packages/python/taiwan_payroll/_data.py` 以檔名自動掃描（`get_available_years` glob `[0-9]{4}.json`），**無需改碼**。
- **wheel 打包**：`packages/python/pyproject.toml` 的 `force-include "../../data"` 自動帶入新檔。

---

## 3. 驗證資料

```bash
pnpm validate:data
```
檢查：JSON Schema（`data/schema.json`）、**級距連續無空洞**（`min = 前級 insured + 1`、頂級 `max = null`、`insuredSalary` 嚴格遞增）、向量格式。

**逐年級數會變，務必逐級核對**（歷史教訓）：

| 年度 | 勞保 | 健保 | 職保 | 勞退 |
|---|---|---|---|---|
| 113（2024） | 13 級 | 50 級 | 23 級 | 62 級 |
| 114（2025） | 12 級 | **59 級** | 22 級 | 62 級 |
| 115（2026） | 11 級 | 58 級 | 21 級 | 62 級 |

- 113→114：基本工資 27,470→28,590，刪除 27,600 級且最低級併入 28,590，故勞保 13→12、職保 23→22；健保反而 50→59（114 新增 313,000 等高級距，上限自 219,500 升至 313,000）。
- 114→115：刪除 28,800 級，故勞保 12→11、健保 59→58、職保 22→21。

逐年級數與上限都會變，務必逐級對官方核對，不可「改底改頂」衍生。

---

## 4. 補黃金測試向量

以官方「保險費負擔金額表」新增該年度錨點向量到 `testdata/official-cases/`（格式見 `testdata/schema.json`），每筆含 `source`（文號／網址）可溯源。建議至少涵蓋：

- 勞保最低級勞工自付（含就保 / 不含就保）、上限級。
- 健保第 1 級本人、含 1 眷、上限級（驗逐人進位）。
- 勞退、職災各一。
- 補充保費若費率／門檻有變則補。

向量為**語言無關 camelCase JSON**，TS（`vitest`）與 Python（`pytest` 的 `test_vectors.py` 自動 camel↔snake 轉換）**兩語言自動納入、逐位元比對**，不需改測試碼。

---

## 5. 兩語言 release

```bash
# 全 monorepo 綠燈
pnpm validate:data && pnpm -r typecheck && pnpm -r test
( cd packages/python && .venv/bin/python -m pytest -q )
```

發版：
- **npm**：`taiwan-payroll`（core）、`taiwan-payroll-mcp`（依賴 core）——core 把對應年度 data 打包，MCP 只需升 core 版本。
- **PyPI**：`taiwan-payroll`——`python -m build --wheel` 後確認 wheel 內含新 `data/{year}.json`（`force-include`）：
  ```bash
  python - <<'PY'
  import zipfile, glob
  z = zipfile.ZipFile(sorted(glob.glob("dist/*.whl"))[-1])
  print([n for n in z.namelist() if n.endswith(".json") and "/data/" in n])
  PY
  ```
- **文件站**：`apps/docs` 重新 `pnpm build`（年度選單由 `getAvailableYears()` 自動帶出，免改碼），更新 `/docs` 的來源文號靜態表。
- **版號**：core/mcp/python 各自 semver；`dataVersion` 標年度資料版。更新各 README 與根 README 的年度敘述。

---

## 6. 快速檢查清單

- [ ] 取得官方四表 PDF／轉錄，抄入文號到 `sources`（不可用記憶數字）
- [ ] `data/{year}.json` 以產生器建立，級數／上限對官方核對
- [ ] 公式錨點手算交叉驗證 1–2 級
- [ ] TS `data.ts` 註冊新年度（Python 自動）
- [ ] `pnpm validate:data` 綠
- [ ] 新增該年度官方錨點向量到 `testdata/`
- [ ] `pnpm -r test` 與 `pytest` 兩語言全綠
- [ ] wheel 確認內含新 data；文件站重 build
- [ ] 更新 README 年度；npm core/mcp + PyPI 發版
