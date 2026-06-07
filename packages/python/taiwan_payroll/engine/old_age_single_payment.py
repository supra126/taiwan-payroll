from __future__ import annotations

from .._rounding import round_half_up, not_finite_number
from .._types import OldAgeSinglePaymentInput, OldAgeSinglePaymentResult


def _assert_non_neg_int(name: str, v) -> None:
    if not isinstance(v, int) or isinstance(v, bool) or v < 0:
        raise ValueError(f"{name} must be a non-negative integer, got {v}")


def calc_old_age_single_payment(data: dict, inp: OldAgeSinglePaymentInput) -> OldAgeSinglePaymentResult:
    spb = (data.get("oldAgePension") or {}).get("singlePaymentBasis")
    if not spb:
        raise ValueError(f"No oldAgePension.singlePaymentBasis for year {data.get('year')}（該年度無一次請領老年給付資料）")
    pre_m = inp.pre_sixty_months
    post_y = inp.post_sixty_years
    post_m = inp.post_sixty_months
    if not_finite_number(inp.avg_insured_salary) or inp.avg_insured_salary < 0:
        raise ValueError(f"avg_insured_salary must be a finite non-negative number, got {inp.avg_insured_salary}")
    _assert_non_neg_int("pre_sixty_years", inp.pre_sixty_years)
    _assert_non_neg_int("pre_sixty_months", pre_m)
    _assert_non_neg_int("post_sixty_years", post_y)
    _assert_non_neg_int("post_sixty_months", post_m)
    if pre_m > 11 or post_m > 11:
        raise ValueError("months must be 0–11")
    P = inp.pre_sixty_years * 12 + pre_m
    Q = post_y * 12 + post_m
    T = spb["firstTierYears"] * 12
    pre60 = min(
        min(P, T) * spb["firstTierBasisPerYear"] + max(0, P - T) * spb["secondTierBasisPerYear"],
        spb["preSixtyMaxBasis"] * 12,
    )
    post60 = spb["secondTierBasisPerYear"] * min(Q, spb["postSixtyCapYears"] * 12)
    basis_twelfths = min(pre60 + post60, spb["combinedMaxBasis"] * 12)
    return OldAgeSinglePaymentResult(
        payment=round_half_up(int(inp.avg_insured_salary) * basis_twelfths, 12),
        basis_twelfths=basis_twelfths,
    )
