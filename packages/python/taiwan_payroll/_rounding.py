"""Integer-exact rate math, mirroring packages/core/src/rounding/strategies.ts."""
from __future__ import annotations

import math
import re

Fraction = tuple[int, int]  # (num, den)
_RATE_RE = re.compile(r"^\d+(\.\d+)?$")


def not_finite_number(x) -> bool:
    """Mirror JS Number.isFinite: bool is NOT a valid number (Number.isFinite(true) === false)."""
    return isinstance(x, bool) or not math.isfinite(x)


def round_half_up(num: int, den: int) -> int:
    # int() guards against a float `base` upstream so the result always honours the integer-NTD contract.
    return int((num * 2 + den) // (den * 2))


def ceil_div(num: int, den: int) -> int:
    return int((num + den - 1) // den)


def parse_rate(s: str) -> Fraction:
    if not _RATE_RE.match(s):
        raise ValueError(f'Invalid rate string "{s}" (expected non-negative decimal like "0.0517")')
    int_part, _, frac = s.partition(".")
    den = 10 ** len(frac)
    num = int(int_part + frac)
    return (num, den)


def number_to_rate_string(n: float) -> str:
    return f"{n:.10f}"


def mul_rates(base: int, rates: list[str]) -> Fraction:
    num, den = base, 1
    for r in rates:
        rn, rd = parse_rate(r)
        num *= rn
        den *= rd
    return (num, den)


def apply_rate(base: int, rates: list[str], strategy: str = "round") -> int:
    num, den = mul_rates(base, rates)
    return ceil_div(num, den) if strategy == "ceil" else round_half_up(num, den)


def apply_rate_prorated(base: int, rates: list[str], days: int, basis: int = 30, strategy: str = "round") -> int:
    num, den = mul_rates(base, rates)
    n = num * days
    d = den * basis
    return ceil_div(n, d) if strategy == "ceil" else round_half_up(n, d)
