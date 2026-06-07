from __future__ import annotations

from .._rounding import round_half_up, not_finite_number
from .._types import OldAgeLumpSumInput, OldAgeLumpSumResult


def _assert_non_neg_int(name: str, v) -> None:
    if not isinstance(v, int) or isinstance(v, bool) or v < 0:
        raise ValueError(f"{name} must be a non-negative integer, got {v}")


def calc_old_age_lump_sum(data: dict, inp: OldAgeLumpSumInput) -> OldAgeLumpSumResult:
    oap = data.get("oldAgePension")
    if not oap:
        raise ValueError(f"No oldAgePension data for year {data.get('year')}（該年度無老年給付資料）")
    months = inp.months
    post60 = inp.post_sixty_months
    if not_finite_number(inp.avg_insured_salary) or inp.avg_insured_salary < 0:
        raise ValueError(f"avg_insured_salary must be a finite non-negative number, got {inp.avg_insured_salary}")
    _assert_non_neg_int("years", inp.years)
    _assert_non_neg_int("months", months)
    _assert_non_neg_int("post_sixty_months", post60)
    if months > 11:
        raise ValueError(f"months must be 0–11, got {months}")
    M = inp.years * 12 + months
    if post60 > M:
        raise ValueError(f"post_sixty_months ({post60}) must not exceed total insured months ({M})")
    cap = oap["lumpSumPostAgeCapYears"] * 12
    effective = (M - post60) + min(post60, cap)
    return OldAgeLumpSumResult(
        payment=round_half_up(int(inp.avg_insured_salary) * effective, 12),
        insured_months_counted=effective,
    )
