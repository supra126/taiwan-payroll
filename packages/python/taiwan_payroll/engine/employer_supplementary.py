from __future__ import annotations

from .._rounding import apply_rate, not_finite_number
from .._types import EmployerSupplementaryInput, EmployerSupplementaryResult


def calc_employer_supplementary(
    data: dict, inp: EmployerSupplementaryInput, rounding: str
) -> EmployerSupplementaryResult:
    a = inp.monthly_paid_total
    b = inp.monthly_insured_total
    if not_finite_number(a) or a < 0:
        raise ValueError(f"monthlyPaidTotal must be a finite non-negative number, got {a}")
    if not_finite_number(b) or b < 0:
        raise ValueError(f"monthlyInsuredTotal must be a finite non-negative number, got {b}")
    rate = data["supplementaryPremium"]["rate"]
    base = int(max(0, a - b))
    return EmployerSupplementaryResult(base=base, rate=rate, premium=apply_rate(base, [rate], rounding))
