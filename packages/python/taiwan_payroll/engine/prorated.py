from __future__ import annotations

import re

from .._lookup import find_bracket, brackets_for
from .._rounding import apply_rate_prorated, number_to_rate_string
from .._identity import get_identity_rules
from .._types import ProratedInput, ProratedResult, Brackets, Employee, Employer, Government, Meta, Days
from .health import calc_health_insurance

_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _clamp(n: int, lo: int, hi: int) -> int:
    return max(lo, min(hi, n))


def _day(d: str) -> int:
    return int(d[8:10])


def _ym(d: str) -> str:
    return d[0:7]


def _assert_iso(d: str) -> None:
    if not _ISO.match(d):
        raise ValueError(f'Date must be in YYYY-MM-DD format, got "{d}"')


def compute_insured_days(start_date: str | None, end_date: str | None) -> int:
    if not start_date and not end_date:
        raise ValueError("calculateProrated requires startDate or endDate")
    if start_date:
        _assert_iso(start_date)
    if end_date:
        _assert_iso(end_date)
    if start_date and end_date and _ym(start_date) != _ym(end_date):
        raise ValueError("startDate and endDate must be in the same month")
    if start_date and end_date:
        s = min(_day(start_date), 30)
        e = min(_day(end_date), 30)
        return _clamp(e - s + 1, 0, 30)
    if start_date:
        return _clamp(30 - min(_day(start_date), 30) + 1, 0, 30)
    return _clamp(min(_day(end_date), 30), 0, 30)


def health_charged_this_month(start_date: str | None, end_date: str | None) -> bool:
    return not end_date


def calc_prorated(data: dict, inp: ProratedInput, occupational_rate: str) -> ProratedResult:
    days = compute_insured_days(inp.start_date, inp.end_date)
    health_charged = health_charged_this_month(inp.start_date, inp.end_date)
    rounding = inp.rounding
    part_time = inp.part_time
    salary = inp.monthly_salary
    rules = get_identity_rules(inp.identity)
    employment_insurance = inp.employment_insurance if rules.employment_insurance_allowed else False

    li = data["laborInsurance"]
    labor_insured = labor_employee = labor_employer = labor_gov = 0
    if rules.labor_applies:
        labor_insured = find_bracket(brackets_for(li["brackets"], li.get("partTimeBrackets"), part_time), salary)["insuredSalary"]
        labor_rate = li["rate"] if employment_insurance else li["rateWithoutEmploymentInsurance"]
        b = li["burden"]
        if rounding == "aggregate-then-round":
            labor_total = apply_rate_prorated(labor_insured, [labor_rate], days, 30, "round")
            labor_employee = apply_rate_prorated(labor_insured, [labor_rate, b["employee"]], days, 30, "round")
            labor_employer = apply_rate_prorated(labor_insured, [labor_rate, b["employer"]], days, 30, "round")
            labor_gov = labor_total - labor_employee - labor_employer
        else:
            labor_employee = apply_rate_prorated(labor_insured, [labor_rate, b["employee"]], days, 30, rounding)
            labor_employer = apply_rate_prorated(labor_insured, [labor_rate, b["employer"]], days, 30, rounding)
            labor_gov = apply_rate_prorated(labor_insured, [labor_rate, b["government"]], days, 30, rounding)

    oi = data["occupationalInsurance"]
    occ_insured = find_bracket(oi["brackets"], salary)["insuredSalary"]
    occ_employer = apply_rate_prorated(occ_insured, [occupational_rate], days, 30, rounding)

    p = data["pension"]
    pen_insured = pen_employer = pen_self = 0
    if rules.pension_applies:
        pen_insured = find_bracket(p["brackets"], salary)["insuredSalary"]
        pen_employer = apply_rate_prorated(pen_insured, [p["employerRate"]], days, 30, rounding)
        clamped = min(max(inp.pension_self_contribution, 0.0), 0.06)
        pen_self = (
            apply_rate_prorated(pen_insured, [number_to_rate_string(clamped)], days, 30, rounding) if clamped > 0 else 0
        )

    hi = data["healthInsurance"]
    health_insured = find_bracket(brackets_for(hi["brackets"], hi.get("partTimeBrackets"), part_time), salary)["insuredSalary"]
    if health_charged:
        h = calc_health_insurance(data, salary, inp.dependents, rounding, part_time)
    else:
        h = {"insured": health_insured, "employee": 0, "employer": 0, "government": 0}

    return ProratedResult(
        brackets=Brackets(labor_insured, health_insured, pen_insured, occ_insured),
        employee=Employee(labor_employee, h["employee"], pen_self, labor_employee + h["employee"] + pen_self),
        employer=Employer(
            labor_employer,
            h["employer"],
            pen_employer,
            occ_employer,
            labor_employer + h["employer"] + pen_employer + occ_employer,
        ),
        government=Government(labor_gov, h["government"]),
        meta=Meta(data["year"], data["dataVersion"]),
        days=Days(days),
        health_charged=health_charged,
    )
