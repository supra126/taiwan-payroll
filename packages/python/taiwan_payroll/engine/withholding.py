from __future__ import annotations

from .._rounding import apply_rate, parse_rate, round_half_up, not_finite_number
from .._types import WithholdingInput, WithholdingResult


def _assert_non_neg(name: str, v: float) -> None:
    if not_finite_number(v) or v < 0:
        raise ValueError(f"{name} must be a finite non-negative number, got {v}")


def calc_withholding(data: dict, inp: WithholdingInput) -> WithholdingResult:
    it = data.get("incomeTax")
    if not it:
        raise ValueError(f"No incomeTax data for year {data.get('year')}（該年度無所得稅扣繳資料）")

    if inp.type == "resident":
        _assert_non_neg("monthlySalary", inp.monthly_salary)
        dep = inp.dependents
        _assert_non_neg("dependents", dep)
        deductions = it["residentExemption"] * (1 + dep) + it["standardDeduction"] + it["salaryDeduction"]
        taxable = int(max(0, inp.monthly_salary * 12 - deductions))
        bracket = next((b for b in it["brackets"] if taxable >= b["min"] and (b["max"] is None or taxable <= b["max"])), None)
        if bracket is None:
            raise ValueError(f"No tax bracket for taxable {taxable}")
        rn, rd = parse_rate(bracket["rate"])
        annual_tax = max(0, round_half_up(taxable * rn - bracket["progressiveDiff"] * rd, rd))
        return WithholdingResult(withholding=round_half_up(annual_tax, 12), rate=bracket["rate"], taxable_annual=taxable)

    if inp.type == "residentBonus":
        _assert_non_neg("amount", inp.amount)
        rate = it["nonMonthly"]["rate"]
        thr = it["nonMonthly"]["threshold"]
        wh = apply_rate(int(inp.amount), [rate], "round") if inp.amount >= thr else 0
        return WithholdingResult(withholding=wh, rate=rate)

    # nonResident
    _assert_non_neg("monthlySalary", inp.monthly_salary)
    threshold = it["nonResident"]["reducedThresholdMultiplier"] * data["minimumWage"]["monthly"]
    rate = it["nonResident"]["reducedRate"] if inp.monthly_salary <= threshold else it["nonResident"]["rate"]
    return WithholdingResult(withholding=apply_rate(int(inp.monthly_salary), [rate], "round"), rate=rate)
