from __future__ import annotations

import math

from .._lookup import find_bracket, brackets_for
from .._rounding import apply_rate


def calc_health_insurance(
    data: dict, monthly_salary: float, dependents: float, rounding: str, part_time: bool = False
) -> dict:
    hi = data["healthInsurance"]
    insured = find_bracket(brackets_for(hi["brackets"], hi.get("partTimeBrackets"), part_time), monthly_salary)["insuredSalary"]
    charged = min(math.floor(max(dependents, 0)), hi["maxDependentsCharged"])
    per_person = apply_rate(insured, [hi["rate"], hi["burden"]["employee"]], rounding)
    return {
        "insured": insured,
        "employee": per_person * (1 + charged),
        "employer": apply_rate(insured, [hi["rate"], hi["burden"]["employer"], hi["employerMultiplier"]], rounding),
        "government": apply_rate(insured, [hi["rate"], hi["burden"]["government"], hi["employerMultiplier"]], rounding),
    }
