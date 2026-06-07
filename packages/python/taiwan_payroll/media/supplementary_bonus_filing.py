from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from .._data import get_year_data
from .._rounding import not_finite_number
from .._types import SupplementaryInput
from ..engine.supplementary import calc_supplementary

NL = "\r\n"
FW = "　"
INCOME_TYPE = "62"
# 逐字複製自 testdata/media/supplementary-bonus-2022-example.csv 第 1、3 行
HEADER_COMMENT = "*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人,聯絡電話,電子郵件信箱,聯絡人姓名"
DETAIL_COMMENT = "*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次獎金給付金額,扣繳補充保險費金額,申報編號(詳格式說明),投保單位代號,扣費當月投保金額,同年度累計獎金金額,資料註記"


@dataclass
class SupplementaryBonusFilingUnit:
    tax_id: str
    name: str
    phone: str
    email: str
    contact_name: str


@dataclass
class SupplementaryBonusRecord:
    action: Literal["I", "R"]
    pay_date: str
    payee_id: str
    payee_name: str
    bonus_amount: float
    insured_salary: float
    ytd_bonus_cumulative: float
    unit_code: str
    filing_no: str = "1"
    note: str = ""


@dataclass
class SupplementaryBonusFilingInput:
    year: int
    unit: SupplementaryBonusFilingUnit
    filing_date: str
    records: list = field(default_factory=list)
    sequence: str = "001"


@dataclass
class SupplementaryBonusFilingResult:
    filename: str
    content: str


def _assert_non_neg(name: str, v: float) -> None:
    if not_finite_number(v) or v < 0:
        raise ValueError(f"{name} must be a finite non-negative number, got {v}")


def _roc_ym(d: str) -> str:
    return f"{int(d[:4]) - 1911:03d}{d[4:6]}"


def _roc_ymd(d: str) -> str:
    return f"{int(d[:4]) - 1911:03d}{d[4:]}"


def _pad_fw(s: str, n: int) -> str:
    return s[:n] if len(s) >= n else s + FW * (n - len(s))


def to_big5_bytes(content: str) -> bytes:
    return content.encode("big5")


def generate_supplementary_bonus_filing(inp: SupplementaryBonusFilingInput) -> SupplementaryBonusFilingResult:
    recs = inp.records
    if not recs:
        raise ValueError("records must not be empty")
    if not (inp.filing_date.isdigit() and len(inp.filing_date) == 8):
        raise ValueError(f"filing_date must be YYYYMMDD, got {inp.filing_date}")
    if len(inp.unit.tax_id) != 8:
        raise ValueError(f"tax_id must be 8 digits, got {inp.unit.tax_id}")
    for r in recs:
        if not (r.pay_date.isdigit() and len(r.pay_date) == 8):
            raise ValueError(f"pay_date must be YYYYMMDD, got {r.pay_date}")
        _assert_non_neg("bonus_amount", r.bonus_amount)
        _assert_non_neg("insured_salary", r.insured_salary)
        _assert_non_neg("ytd_bonus_cumulative", r.ytd_bonus_cumulative)
    yms = [_roc_ym(r.pay_date) for r in recs]
    if len({ym[:3] for ym in yms}) > 1:
        raise ValueError("all pay_date must be in the same ROC year")
    data = get_year_data(inp.year)
    premiums = [
        calc_supplementary(
            data,
            SupplementaryInput(type="bonus", amount=int(r.bonus_amount), monthly_insured_salary=int(r.insured_salary), ytd_bonus=int(r.ytd_bonus_cumulative - r.bonus_amount)),
            "round",
        ).premium
        for r in recs
    ]
    u = inp.unit
    header = ",".join([
        "1", u.tax_id, INCOME_TYPE, min(yms), max(yms), str(len(recs)),
        str(sum(int(r.bonus_amount) for r in recs)), str(sum(premiums)),
        _pad_fw(u.name, 25), u.phone, u.email, _pad_fw(u.contact_name, 25),
    ])
    details = [
        ",".join(["2", r.action, _roc_ymd(r.pay_date), r.payee_id, r.payee_name,
                  str(int(r.bonus_amount)), str(premiums[i]), r.filing_no, r.unit_code,
                  str(int(r.insured_salary)), str(int(r.ytd_bonus_cumulative)), r.note])
        for i, r in enumerate(recs)
    ]
    content = NL.join([HEADER_COMMENT, header, DETAIL_COMMENT, *details]) + NL
    filename = f"DPR{u.tax_id}{_roc_ymd(inp.filing_date)}{inp.sequence}.csv"
    return SupplementaryBonusFilingResult(filename=filename, content=content)
