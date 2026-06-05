from __future__ import annotations

from .._lookup import find_bracket
from .._rounding import apply_rate


def calc_occupational(data: dict, monthly_salary: float, occupational_rate: str, rounding: str) -> dict:
    oi = data["occupationalInsurance"]
    insured = find_bracket(oi["brackets"], monthly_salary)["insuredSalary"]
    return {"insured": insured, "employer": apply_rate(insured, [occupational_rate], rounding)}
