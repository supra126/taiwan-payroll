from pathlib import Path
import pytest
from taiwan_payroll import (
    generate_supplementary_bonus_filing,
    to_big5_bytes,
    SupplementaryBonusFilingInput as I,
    SupplementaryBonusFilingUnit as U,
    SupplementaryBonusRecord as R,
)

_TD = Path(__file__).resolve().parents[3] / "testdata" / "media"
# read_bytes().decode 保留 CRLF（Path.read_text 的 newline 參數 Python 3.13 才支援，本專案 ≥3.10）
_CSV = (_TD / "supplementary-bonus-2022-example.csv").read_bytes().decode("utf-8")
_BIG5 = (_TD / "supplementary-bonus-2022-example.big5").read_bytes()

def _example():
    recs = [
        R(action="I", pay_date="20220615", payee_id="A222222222", payee_name="甄健康", bonus_amount=50000, insured_salary=31800, ytd_bonus_cumulative=150000, unit_code="123456789"),
        R(action="I", pay_date="20220715", payee_id="A222222222", payee_name="甄健康", bonus_amount=15000, insured_salary=30300, ytd_bonus_cumulative=165000, unit_code="123456789"),
        R(action="I", pay_date="20220815", payee_id="A222222222", payee_name="甄健康", bonus_amount=15000, insured_salary=30300, ytd_bonus_cumulative=180000, unit_code="123456789"),
    ]
    return I(year=2026, filing_date="20220901", unit=U(tax_id="11111111", name="甄健康有限公司", phone="0227065866#0123", email="chuan@mail.tw", contact_name="陳一一"), records=recs)

def test_golden_char():
    assert generate_supplementary_bonus_filing(_example()).content == _CSV

def test_golden_big5_bytes():
    assert to_big5_bytes(generate_supplementary_bonus_filing(_example()).content) == _BIG5

def test_filename():
    assert generate_supplementary_bonus_filing(_example()).filename == "DPR111111111110901001.csv"

def test_validation():
    with pytest.raises(ValueError):
        generate_supplementary_bonus_filing(I(year=2026, filing_date="20220901", unit=_example().unit, records=[]))
