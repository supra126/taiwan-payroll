from __future__ import annotations

from .._lookup import find_bracket
from .._rounding import apply_rate, number_to_rate_string


def calc_pension(data: dict, monthly_salary: float, self_contribution_rate: float, rounding: str) -> dict:
    p = data["pension"]
    insured = find_bracket(p["brackets"], monthly_salary)["insuredSalary"]
    clamped = min(max(self_contribution_rate, 0.0), 0.06)
    self_rate = number_to_rate_string(clamped)
    return {
        "insured": insured,
        "employer": apply_rate(insured, [p["employerRate"]], rounding),
        "self": apply_rate(insured, [self_rate], rounding) if clamped > 0 else 0,
    }
