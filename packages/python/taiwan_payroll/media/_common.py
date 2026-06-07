from __future__ import annotations

from .._rounding import not_finite_number

NL = "\r\n"
FW = "　"


def assert_non_neg(name: str, v: float) -> None:
    if not_finite_number(v) or v < 0:
        raise ValueError(f"{name} must be a finite non-negative number, got {v}")


def roc_ym(d: str) -> str:
    return f"{int(d[:4]) - 1911:03d}{d[4:6]}"


def roc_ymd(d: str) -> str:
    return f"{int(d[:4]) - 1911:03d}{d[4:]}"


def pad_fw(s: str, n: int) -> str:
    return s[:n] if len(s) >= n else s + FW * (n - len(s))


def build_header_row(unit, income_type, start_ym, end_ym, count, total_pay, total_premium) -> str:
    return ",".join([
        "1", unit.tax_id, income_type, start_ym, end_ym, str(count), str(total_pay), str(total_premium),
        pad_fw(unit.name, 25), unit.phone, unit.email, pad_fw(unit.contact_name, 25),
    ])


def build_content(header_comment, header_row, detail_comment, detail_rows) -> str:
    return NL.join([header_comment, header_row, detail_comment, *detail_rows]) + NL


def build_filename(tax_id, filing_date, sequence) -> str:
    return f"DPR{tax_id}{roc_ymd(filing_date)}{sequence}.csv"


def range_ym(pay_dates):
    yms = [roc_ym(d) for d in pay_dates]
    if len({y[:3] for y in yms}) > 1:
        raise ValueError("all pay_date must be in the same ROC year")
    return min(yms), max(yms)


def validate_unit_and_date(tax_id, filing_date):
    if not (filing_date.isdigit() and len(filing_date) == 8):
        raise ValueError(f"filing_date must be YYYYMMDD, got {filing_date}")
    if len(tax_id) != 8:
        raise ValueError(f"tax_id must be 8 digits, got {tax_id}")
