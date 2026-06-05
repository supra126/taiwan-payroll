from __future__ import annotations

from .._rounding import apply_rate, not_finite_number
from .._types import SupplementaryInput, SupplementaryResult


def calc_supplementary(data: dict, inp: SupplementaryInput, rounding: str) -> SupplementaryResult:
    sp = data["supplementaryPremium"]
    if not_finite_number(inp.amount) or inp.amount < 0:
        raise ValueError(f"amount must be a finite non-negative number, got {inp.amount}")

    if inp.type == "bonus":
        mis = inp.monthly_insured_salary
        if mis is None or not_finite_number(mis) or mis <= 0:
            raise ValueError(f"bonus requires a positive monthlyInsuredSalary, got {mis}")
        ytd = inp.ytd_bonus if inp.ytd_bonus is not None else 0
        if not_finite_number(ytd) or ytd < 0:
            raise ValueError(f"ytdBonus must be a finite non-negative number, got {ytd}")
        threshold = sp["bonusThresholdMultiplier"] * mis
        chargeable = int(max(0, ytd + inp.amount - max(ytd, threshold)))
    else:
        threshold = data["minimumWage"]["monthly"] if inp.type == "parttime" else sp["lowerThreshold"]
        chargeable = int(min(inp.amount, sp["singlePaymentCap"])) if inp.amount >= threshold else 0

    return SupplementaryResult(
        type=inp.type,
        chargeable=chargeable,
        rate=sp["rate"],
        premium=apply_rate(chargeable, [sp["rate"]], rounding),
    )
