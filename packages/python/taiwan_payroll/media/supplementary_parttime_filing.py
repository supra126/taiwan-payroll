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
from .supplementary_bonus_filing import (
    SupplementaryBonusFilingResult,
    SupplementaryBonusFilingUnit,
)

INCOME_TYPE = "63"
# 逐字複製自 testdata/media/supplementary-parttime-2022-example.csv 第 1、3 行
HEADER_COMMENT = "*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人,聯絡電話,電子郵件信箱,聯絡人姓名"
DETAIL_COMMENT = "*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次給付金額,扣繳補充保險費金額,申報編號(詳格式說明),信託註記,資料註記,,"


@dataclass
class SupplementaryParttimeRecord:
    action: Literal["I", "R"]
    pay_date: str
    payee_id: str
    payee_name: str
    amount: float
    filing_no: str = "1"
    trust_note: str = ""
    note: str = ""


@dataclass
class SupplementaryParttimeFilingInput:
    year: int
    unit: SupplementaryBonusFilingUnit
    filing_date: str
    records: list = field(default_factory=list)
    sequence: str = "001"


def generate_supplementary_parttime_filing(inp: SupplementaryParttimeFilingInput) -> SupplementaryBonusFilingResult:
    recs = inp.records
    if not recs:
        raise ValueError("records must not be empty")
    validate_unit_and_date(inp.unit.tax_id, inp.filing_date)
    for r in recs:
        if not (r.pay_date.isdigit() and len(r.pay_date) == 8):
            raise ValueError(f"pay_date must be YYYYMMDD, got {r.pay_date}")
        assert_non_neg("amount", r.amount)
    start, end = range_ym([r.pay_date for r in recs])
    data = get_year_data(inp.year)
    premiums = [
        calc_supplementary(data, SupplementaryInput(type="parttime", amount=int(r.amount)), "round").premium
        for r in recs
    ]
    u = inp.unit
    header = build_header_row(
        u, INCOME_TYPE, start, end, len(recs),
        sum(int(r.amount) for r in recs), sum(premiums),
    )
    details = [
        ",".join(["2", r.action, roc_ymd(r.pay_date), r.payee_id, r.payee_name,
                  str(int(r.amount)), str(premiums[i]), r.filing_no, r.trust_note, r.note, "", ""])
        for i, r in enumerate(recs)
    ]
    content = build_content(HEADER_COMMENT, header, DETAIL_COMMENT, details)
    filename = build_filename(u.tax_id, inp.filing_date, inp.sequence)
    return SupplementaryBonusFilingResult(filename=filename, content=content)
