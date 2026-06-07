# taiwan-payroll (Python)

台灣勞健保勞退法定費用計算引擎的 Python 實作。讀同一份 `data/`，跑通同一套 `testdata/` 黃金向量，與 TypeScript 版計算結果完全一致。零執行期依賴（純 stdlib）。

## 安裝

```bash
pip install taiwan-payroll
```

## 用法

```python
from taiwan_payroll import create_payroll_engine, CalculateInput, SupplementaryInput, ProratedInput

engine = create_payroll_engine(year=2026)
engine.calculate(CalculateInput(monthly_salary=42000, dependents=1, pension_self_contribution=0.06))
engine.calculate_supplementary(SupplementaryInput(type="bonus", amount=200000, monthly_insured_salary=42000))
engine.calculate_prorated(ProratedInput(monthly_salary=29500, start_date="2026-03-08"))
```

### 申報媒體檔（健保補充保費）

產生健保署「補充保險費明細申報檔」（CSV／Big5），6 類所得各一（獎金62/兼職63/執行業務65/股利66/利息67/租金68），皆以官方範例逐位元驗證、與 TypeScript 版一致。

```python
from taiwan_payroll import generate_supplementary_bonus_filing, to_big5_bytes, SupplementaryBonusFilingInput, SupplementaryBonusFilingUnit, SupplementaryBonusRecord

r = generate_supplementary_bonus_filing(SupplementaryBonusFilingInput(
    year=2026, filing_date="20260901",
    unit=SupplementaryBonusFilingUnit(tax_id="11111111", name="甲公司", phone="0227065866", email="a@b.tw", contact_name="王小明"),
    records=[SupplementaryBonusRecord(action="I", pay_date="20260615", payee_id="A123456789", payee_name="李四",
        bonus_amount=50000, insured_salary=31800, ytd_bonus_cumulative=150000, unit_code="123456789")],
))
open(r.filename, "wb").write(to_big5_bytes(r.content))  # 檔案為 Big5
```

股利（`generate_supplementary_dividend_filing`）逐列保費由呼叫端提供（另附 `calc_dividend_premium`）。

### 勞保老年給付試算

`calc_old_age_pension`（年金月領，擇優兩式、可提前/延後）、`calc_old_age_lump_sum`（老年一次金）、`calc_old_age_single_payment`（一次請領，舊制基數），皆對勞保局官方數值/公式驗證、與 TypeScript 版一致。

```python
from taiwan_payroll import calc_old_age_pension, get_year_data, OldAgePensionInput
calc_old_age_pension(get_year_data(2026), OldAgePensionInput(avg_insured_salary=32000, years=35, months=6))
```

## 開發

```bash
cd packages/python && python3 -m venv .venv && .venv/bin/python -m pip install -e ".[test]"
.venv/bin/python -m pytest
```

跨語言一致性：`tests/test_vectors.py` 載入 repo 根 `testdata/` 的同一套黃金向量，與 TypeScript 引擎逐位元比對。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。
