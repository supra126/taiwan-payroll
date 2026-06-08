from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from .._data import get_year_data
from .._types import SupplementaryInput
from ..engine.supplementary import calc_supplementary
from ._common import (
    assert_non_neg,
    build_content,
    build_filename,
    build_header_row,
    range_ym,
    roc_ymd,
    validate_unit_and_date,
)

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


def to_big5_bytes(content: str) -> bytes:
    return content.encode("big5")


def generate_supplementary_bonus_filing(inp: SupplementaryBonusFilingInput) -> SupplementaryBonusFilingResult:
    recs = inp.records
    if not recs:
        raise ValueError("records must not be empty")
    validate_unit_and_date(inp.unit.tax_id, inp.filing_date)
    for r in recs:
        if not (r.pay_date.isdigit() and len(r.pay_date) == 8):
            raise ValueError(f"pay_date must be YYYYMMDD, got {r.pay_date}")
        assert_non_neg("bonus_amount", r.bonus_amount)
        assert_non_neg("insured_salary", r.insured_salary)
        assert_non_neg("ytd_bonus_cumulative", r.ytd_bonus_cumulative)
        # ytd_bonus_cumulative 為「含本筆」的年度累計，須 >= 本筆獎金；否則下游 ytd_bonus 會變負數並丟出費解的錯誤。
        if r.ytd_bonus_cumulative < r.bonus_amount:
            raise ValueError(f"ytd_bonus_cumulative ({r.ytd_bonus_cumulative}) must be >= bonus_amount ({r.bonus_amount})")
    start, end = range_ym([r.pay_date for r in recs])
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
    header = build_header_row(
        u, INCOME_TYPE, start, end, len(recs),
        sum(int(r.bonus_amount) for r in recs), sum(premiums),
    )
    details = [
        ",".join(["2", r.action, roc_ymd(r.pay_date), r.payee_id, r.payee_name,
                  str(int(r.bonus_amount)), str(premiums[i]), r.filing_no, r.unit_code,
                  str(int(r.insured_salary)), str(int(r.ytd_bonus_cumulative)), r.note])
        for i, r in enumerate(recs)
    ]
    content = build_content(HEADER_COMMENT, header, DETAIL_COMMENT, details)
    filename = build_filename(u.tax_id, inp.filing_date, inp.sequence)
    return SupplementaryBonusFilingResult(filename=filename, content=content)
