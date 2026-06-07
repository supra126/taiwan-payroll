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


from taiwan_payroll import (
    generate_supplementary_parttime_filing,
    SupplementaryParttimeFilingInput as PI,
    SupplementaryParttimeRecord as PR,
)

_PCSV = (_TD / "supplementary-parttime-2022-example.csv").read_bytes().decode("utf-8")
_PBIG5 = (_TD / "supplementary-parttime-2022-example.big5").read_bytes()


def _pt():
    recs = [
        PR(action="I", pay_date=d, payee_id="A222222222", payee_name="甄健康", amount=30000, filing_no=n)
        for d, n in [("20220228", "1"), ("20220418", "1"), ("20220529", "1"), ("20220529", "2")]
    ]
    return PI(year=2026, filing_date="20220901", unit=U(tax_id="11111111", name="甄健康有限公司", phone="0227065866#0123", email="chuan@mail.tw", contact_name="陳一一"), records=recs)


def test_parttime_golden_char():
    assert generate_supplementary_parttime_filing(_pt()).content == _PCSV


def test_parttime_golden_big5():
    assert to_big5_bytes(generate_supplementary_parttime_filing(_pt()).content) == _PBIG5


def test_parttime_filename():
    assert generate_supplementary_parttime_filing(_pt()).filename == "DPR111111111110901001.csv"


from taiwan_payroll import (
    generate_supplementary_professional_filing,
    SupplementaryProfessionalFilingInput as FI,
    SupplementaryProfessionalRecord as FR,
)

_FCSV = (_TD / "supplementary-professional-2022-example.csv").read_bytes().decode("utf-8")
_FBIG5 = (_TD / "supplementary-professional-2022-example.big5").read_bytes()


def _prof():
    recs = [
        FR(action="I", pay_date=d, payee_id="A222222222", payee_name="甄健康", amount=40000, filing_no=n)
        for d, n in [("20220101", "1"), ("20220301", "1"), ("20220601", "1"), ("20220901", "1"), ("20221201", "1"), ("20221201", "2")]
    ]
    return FI(year=2026, filing_date="20220901", unit=U(tax_id="11111111", name="甄健康有限公司", phone="0227065866#0123", email="chuan@mail.tw", contact_name="陳一一"), records=recs)


def test_professional_golden_char():
    assert generate_supplementary_professional_filing(_prof()).content == _FCSV


def test_professional_golden_big5():
    assert to_big5_bytes(generate_supplementary_professional_filing(_prof()).content) == _FBIG5


def test_professional_filename():
    assert generate_supplementary_professional_filing(_prof()).filename == "DPR111111111110901001.csv"


from taiwan_payroll import (
    generate_supplementary_interest_filing,
    generate_supplementary_rent_filing,
    SupplementaryInterestFilingInput as II,
    SupplementaryRentFilingInput as RI,
)

_ICSV = (_TD / "supplementary-interest-2022-example.csv").read_bytes().decode("utf-8")
_IBIG5 = (_TD / "supplementary-interest-2022-example.big5").read_bytes()
_RCSV = (_TD / "supplementary-rent-2022-example.csv").read_bytes().decode("utf-8")
_RBIG5 = (_TD / "supplementary-rent-2022-example.big5").read_bytes()
_U = U(tax_id="11111111", name="甄健康有限公司", phone="0227065866#0123", email="chuan@mail.tw", contact_name="陳一一")


def _interest():
    rows = [
        ("20220130", "A222222222", "甄健康", "1"),
        ("20220130", "A233333333", "甄美麗", "1"),
        ("20220630", "A222222222", "甄健康", "1"),
        ("20220630", "A233333333", "甄美麗", "1"),
        ("20221230", "A222222222", "甄健康", "1"),
        ("20221230", "A233333333", "甄美麗", "1"),
        ("20221230", "A233333333", "甄美麗", "2"),
    ]
    recs = [PR(action="I", pay_date=d, payee_id=i, payee_name=n, amount=20000, filing_no=f) for d, i, n, f in rows]
    return II(year=2026, filing_date="20220901", unit=_U, records=recs)


def _rent():
    dates = ["20220131", "20220227", "20220329", "20220430", "20220531", "20220630", "20220730", "20220830", "20220930", "20221030", "20221130", "20221230"]
    recs = [PR(action="I", pay_date=d, payee_id="A222222222", payee_name="甄健康", amount=40000, filing_no="1") for d in dates]
    return RI(year=2026, filing_date="20220901", unit=_U, records=recs)


def test_interest_golden_char():
    assert generate_supplementary_interest_filing(_interest()).content == _ICSV


def test_interest_golden_big5():
    assert to_big5_bytes(generate_supplementary_interest_filing(_interest()).content) == _IBIG5


def test_interest_filename():
    assert generate_supplementary_interest_filing(_interest()).filename == "DPR111111111110901001.csv"


def test_rent_golden_char():
    assert generate_supplementary_rent_filing(_rent()).content == _RCSV


def test_rent_golden_big5():
    assert to_big5_bytes(generate_supplementary_rent_filing(_rent()).content) == _RBIG5


def test_rent_filename():
    assert generate_supplementary_rent_filing(_rent()).filename == "DPR111111111110901001.csv"


from taiwan_payroll import (
    generate_supplementary_dividend_filing,
    SupplementaryDividendFilingInput as DI,
    SupplementaryDividendRecord as DR,
)

_DCSV = (_TD / "supplementary-dividend-2022-example.csv").read_bytes().decode("utf-8")
_DBIG5 = (_TD / "supplementary-dividend-2022-example.big5").read_bytes()


def _dividend():
    recs = [
        DR(action="I", pay_date="20220715", payee_id="A222222222", payee_name="甄健康", amount=25620, premium=541, ex_dividend_date="20220601", dividend_type="3"),
        DR(action="I", pay_date="20220715", payee_id="A233333333", payee_name="甄美麗", amount=20000, premium=422, ex_dividend_date="20220601", dividend_type="3"),
        DR(action="I", pay_date="20220825", payee_id="A244444444", payee_name="甄順利", amount=3000000, premium=17218, ex_dividend_date="20220701", dividend_type="2", employer_insured_total=2184000, belonging_year="110"),
        DR(action="I", pay_date="20220915", payee_id="A255555555", payee_name="甄快樂", amount=20000, premium=0, ex_dividend_date="20220601", dividend_type="1"),
    ]
    return DI(filing_date="20220901", unit=_U, records=recs)


def test_dividend_golden_char():
    assert generate_supplementary_dividend_filing(_dividend()).content == _DCSV


def test_dividend_golden_big5():
    assert to_big5_bytes(generate_supplementary_dividend_filing(_dividend()).content) == _DBIG5


def test_dividend_filename():
    assert generate_supplementary_dividend_filing(_dividend()).filename == "DPR111111111110901001.csv"
