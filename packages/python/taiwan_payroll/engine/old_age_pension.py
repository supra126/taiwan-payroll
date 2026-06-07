from __future__ import annotations

from .._rounding import parse_rate, round_half_up, not_finite_number
from .._types import OldAgePensionInput, OldAgePensionResult


def _assert_non_neg(name: str, v: float) -> None:
    if not_finite_number(v) or v < 0:
        raise ValueError(f"{name} must be a finite non-negative number, got {v}")


def calc_old_age_pension(data: dict, inp: OldAgePensionInput) -> OldAgePensionResult:
    oap = data.get("oldAgePension")
    if not oap:
        raise ValueError(f"No oldAgePension data for year {data.get('year')}（該年度無老年年金資料）")
    months = inp.months
    offset = inp.claim_offset_months
    _assert_non_neg("avg_insured_salary", inp.avg_insured_salary)
    _assert_non_neg("years", inp.years)
    _assert_non_neg("months", months)
    if not (isinstance(months, int) and 0 <= months <= 11):
        raise ValueError(f"months must be an integer 0–11, got {months}")
    if not isinstance(inp.years, int) or isinstance(inp.years, bool):
        raise ValueError(f"years must be an integer, got {inp.years}")
    if not isinstance(offset, int) or isinstance(offset, bool):
        raise ValueError(f"claim_offset_months must be an integer, got {offset}")

    M = int(inp.years) * 12 + months
    cap = oap["maxAdjustYears"] * 12
    adj = max(-cap, min(cap, offset))
    a_num, a_den = parse_rate(oap["adjustPerYearRate"])
    fN = 12 * a_den + adj * a_num
    fD = 12 * a_den
    an, ad = parse_rate(oap["formulaARate"])
    formula_a = round_half_up(
        (int(inp.avg_insured_salary) * M * an + oap["formulaABonus"] * 12 * ad) * fN,
        12 * ad * fD,
    )
    bn, bd = parse_rate(oap["formulaBRate"])
    formula_b = round_half_up(int(inp.avg_insured_salary) * M * bn * fN, 12 * bd * fD)
    return OldAgePensionResult(
        formula_a=formula_a,
        formula_b=formula_b,
        monthly=max(formula_a, formula_b),
        adjustment_months=adj,
        eligible=M >= oap["minYearsForPension"] * 12,
    )


def average_highest_insured_salary(monthly_salaries: list) -> int:
    if not monthly_salaries:
        raise ValueError("monthly_salaries must not be empty")
    for i, s in enumerate(monthly_salaries):
        _assert_non_neg(f"monthly_salaries[{i}]", s)
    top = sorted(monthly_salaries, reverse=True)[:60]
    return round_half_up(sum(int(x) for x in top), len(top))


def statutory_claim_age(data: dict, born_roc_year: int) -> int:
    sa = (data.get("oldAgePension") or {}).get("statutoryAge")
    if not sa:
        raise ValueError(f"No oldAgePension data for year {data.get('year')}")
    for e in sa["schedule"]:
        if born_roc_year <= e["maxBornRocYear"]:
            return e["age"]
    return sa["defaultAge"]
