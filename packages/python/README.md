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

## 開發

```bash
cd packages/python && python3 -m venv .venv && .venv/bin/python -m pip install -e ".[test]"
.venv/bin/python -m pytest
```

跨語言一致性：`tests/test_vectors.py` 載入 repo 根 `testdata/` 的同一套黃金向量，與 TypeScript 引擎逐位元比對。

## 免責聲明

計算結果僅供參考，實際應繳金額以勞保局、健保署核發之繳款單為準。
