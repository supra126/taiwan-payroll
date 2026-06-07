from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal, Optional

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

INCOME_TYPE = "66"
# 逐字複製自 testdata/media/supplementary-dividend-2022-example.csv 第 1、3 行（表頭結尾 5 逗號；明細 17 欄）
HEADER_COMMENT = "*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人名稱,聯絡電話,電子郵件信箱,聯絡人姓名,,,,,"
DETAIL_COMMENT = "*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次給付金額,扣繳補充保險費金額,申報編號(詳格式說明),信託註記,扣取時可扣抵稅額,年度確定可扣抵稅額,股利所屬期間以雇主身分投保期間之投保金額總額,除權(息)基準日期,股利註記,特殊註記,股利所屬期間起迄年月,股利所屬年度"


@dataclass
class SupplementaryDividendRecord:
    action: Literal["I", "R"]
    pay_date: str
    payee_id: str
    payee_name: str
    amount: float
    premium: float
    ex_dividend_date: str
    dividend_type: Literal["1", "2", "3"]
    filing_no: str = "1"
    trust_note: str = ""
    creditable_tax_withholding: float = 0
    creditable_tax_final: float = 0
    employer_insured_total: Optional[float] = None
    special_note: str = ""
    belonging_period: str = ""
    belonging_year: str = ""


@dataclass
class SupplementaryDividendFilingInput:
    unit: SupplementaryBonusFilingUnit
    filing_date: str
    records: list = field(default_factory=list)
    sequence: str = "001"


def generate_supplementary_dividend_filing(inp: SupplementaryDividendFilingInput) -> SupplementaryBonusFilingResult:
    recs = inp.records
    if not recs:
        raise ValueError("records must not be empty")
    validate_unit_and_date(inp.unit.tax_id, inp.filing_date)
    for r in recs:
        if not (r.pay_date.isdigit() and len(r.pay_date) == 8):
            raise ValueError(f"pay_date must be YYYYMMDD, got {r.pay_date}")
        if not (r.ex_dividend_date.isdigit() and len(r.ex_dividend_date) == 8):
            raise ValueError(f"ex_dividend_date must be YYYYMMDD, got {r.ex_dividend_date}")
        assert_non_neg("amount", r.amount)
        assert_non_neg("premium", r.premium)
    start, end = range_ym([r.pay_date for r in recs])
    u = inp.unit
    header = build_header_row(
        u, INCOME_TYPE, start, end, len(recs),
        sum(int(r.amount) for r in recs), sum(int(r.premium) for r in recs),
    ) + ",,,,,"
    details = [
        ",".join([
            "2", r.action, roc_ymd(r.pay_date), r.payee_id, r.payee_name,
            str(int(r.amount)), str(int(r.premium)), r.filing_no, r.trust_note,
            str(int(r.creditable_tax_withholding)), str(int(r.creditable_tax_final)),
            ("" if r.employer_insured_total is None else str(int(r.employer_insured_total))),
            roc_ymd(r.ex_dividend_date), r.dividend_type, r.special_note,
            r.belonging_period, r.belonging_year,
        ])
        for r in recs
    ]
    content = build_content(HEADER_COMMENT, header, DETAIL_COMMENT, details)
    filename = build_filename(u.tax_id, inp.filing_date, inp.sequence)
    return SupplementaryBonusFilingResult(filename=filename, content=content)
