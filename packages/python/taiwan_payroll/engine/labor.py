from __future__ import annotations

from .._lookup import find_bracket, brackets_for
from .._rounding import apply_rate


def calc_labor_insurance(
    data: dict, monthly_salary: float, employment_insurance: bool, rounding: str, part_time: bool = False
) -> dict:
    li = data["laborInsurance"]
    insured = find_bracket(brackets_for(li["brackets"], li.get("partTimeBrackets"), part_time), monthly_salary)["insuredSalary"]
    rate = li["rate"] if employment_insurance else li["rateWithoutEmploymentInsurance"]
    b = li["burden"]
    if rounding == "aggregate-then-round":
        total = apply_rate(insured, [rate], "round")
        employee = apply_rate(insured, [rate, b["employee"]], "round")
        employer = apply_rate(insured, [rate, b["employer"]], "round")
        return {"insured": insured, "employee": employee, "employer": employer, "government": total - employee - employer}
    return {
        "insured": insured,
        "employee": apply_rate(insured, [rate, b["employee"]], rounding),
        "employer": apply_rate(insured, [rate, b["employer"]], rounding),
        "government": apply_rate(insured, [rate, b["government"]], rounding),
    }
