"""Bracket lookup, mirroring packages/core/src/lookup/bracket.ts."""
from __future__ import annotations


def find_bracket(brackets: list[dict], salary: float) -> dict:
    for b in brackets:
        if b["max"] is None or salary <= b["max"]:
            return b
    return brackets[-1]


def brackets_for(regular: list[dict], part_time_brackets: list[dict] | None, part_time: bool) -> list[dict]:
    """Search table: prepend part-time low brackets when part-time and present (勞保/健保)."""
    return (part_time_brackets + regular) if (part_time and part_time_brackets) else regular
