from __future__ import annotations

from ._data import get_year_data
from ._rounding import number_to_rate_string, not_finite_number
from ._identity import get_identity_rules
from ._types import (
    CalculateInput,
    CalculateResult,
    Brackets,
    Employee,
    Employer,
    Government,
    Meta,
    SupplementaryInput,
    SupplementaryResult,
    ProratedInput,
    ProratedResult,
    EmployerSupplementaryInput,
    EmployerSupplementaryResult,
    WithholdingInput,
    WithholdingResult,
    OldAgePensionInput,
    OldAgePensionResult,
)
from .engine.labor import calc_labor_insurance
from .engine.health import calc_health_insurance
from .engine.pension import calc_pension
from .engine.occupational import calc_occupational
from .engine.supplementary import calc_supplementary
from .engine.prorated import calc_prorated
from .engine.employer_supplementary import calc_employer_supplementary
from .engine.withholding import calc_withholding
from .engine.old_age_pension import calc_old_age_pension


def _validate_base(inp: CalculateInput | ProratedInput) -> None:
    if not_finite_number(inp.monthly_salary) or inp.monthly_salary < 0:
        raise ValueError(f"monthlySalary must be a finite non-negative number, got {inp.monthly_salary}")
    if inp.dependents is not None and not_finite_number(inp.dependents):
        raise ValueError(f"dependents must be a finite number, got {inp.dependents}")
    if inp.pension_self_contribution is not None and not_finite_number(inp.pension_self_contribution):
        raise ValueError(f"pensionSelfContribution must be a finite number, got {inp.pension_self_contribution}")
    get_identity_rules(inp.identity)  # throws for an unknown identity


class PayrollEngine:
    def __init__(self, year: int) -> None:
        self._data = get_year_data(year)

    def _resolve_occupational_rate(self, occupational_rate: float | None) -> str:
        if occupational_rate is None:
            return self._data["occupationalInsurance"]["defaultRate"]
        if not_finite_number(occupational_rate) or occupational_rate < 0 or occupational_rate >= 0.02:
            raise ValueError(f"occupationalRate must be a fraction in [0, 0.02), got {occupational_rate}")
        return number_to_rate_string(occupational_rate)

    def calculate(self, inp: CalculateInput) -> CalculateResult:
        _validate_base(inp)
        rules = get_identity_rules(inp.identity)
        data = self._data
        occ_rate = self._resolve_occupational_rate(inp.occupational_rate)
        employment_insurance = inp.employment_insurance if rules.employment_insurance_allowed else False
        labor = (
            calc_labor_insurance(data, inp.monthly_salary, employment_insurance, inp.rounding, inp.part_time)
            if rules.labor_applies
            else {"insured": 0, "employee": 0, "employer": 0, "government": 0}
        )
        health = calc_health_insurance(data, inp.monthly_salary, inp.dependents, inp.rounding, inp.part_time)
        pension = (
            calc_pension(data, inp.monthly_salary, inp.pension_self_contribution, inp.rounding)
            if rules.pension_applies
            else {"insured": 0, "employer": 0, "self": 0}
        )
        occ = calc_occupational(data, inp.monthly_salary, occ_rate, inp.rounding)
        return CalculateResult(
            brackets=Brackets(labor["insured"], health["insured"], pension["insured"], occ["insured"]),
            employee=Employee(
                labor["employee"],
                health["employee"],
                pension["self"],
                labor["employee"] + health["employee"] + pension["self"],
            ),
            employer=Employer(
                labor["employer"],
                health["employer"],
                pension["employer"],
                occ["employer"],
                labor["employer"] + health["employer"] + pension["employer"] + occ["employer"],
            ),
            government=Government(labor["government"], health["government"]),
            meta=Meta(data["year"], data["dataVersion"]),
        )

    def calculate_supplementary(self, inp: SupplementaryInput) -> SupplementaryResult:
        return calc_supplementary(self._data, inp, inp.rounding)

    def calculate_employer_supplementary(self, inp: EmployerSupplementaryInput) -> EmployerSupplementaryResult:
        return calc_employer_supplementary(self._data, inp, inp.rounding)

    def calculate_withholding(self, inp: WithholdingInput) -> WithholdingResult:
        return calc_withholding(self._data, inp)

    def calculate_old_age_pension(self, inp: OldAgePensionInput) -> OldAgePensionResult:
        return calc_old_age_pension(self._data, inp)

    def calculate_prorated(self, inp: ProratedInput) -> ProratedResult:
        _validate_base(inp)
        occ_rate = self._resolve_occupational_rate(inp.occupational_rate)
        return calc_prorated(self._data, inp, occ_rate)


def create_payroll_engine(year: int) -> PayrollEngine:
    return PayrollEngine(year)
