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


def calc_dividend_premium(data: dict, amount: float, employer_insured_total: float = 0) -> int:
    """股利扣繳補充保費（一般股東/雇主常見情況）。

    一般股東：單次給付 × 費率（單次達下限起扣）；雇主：(單次給付 − 投保額總額) × 費率。
    股票股利/特殊註記等情形不在涵蓋範圍，請由呼叫端自行判定後以 record.premium 提供。
    """
    sp = data["supplementaryPremium"]
    if amount < sp["lowerThreshold"]:
        return 0
    base = int(max(0, min(amount, sp["singlePaymentCap"]) - employer_insured_total))
    return apply_rate(base, [sp["rate"]], "round")
