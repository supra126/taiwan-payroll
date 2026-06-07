"""Public input/result dataclasses (snake_case), mirroring packages/core/src/types.ts."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

Rounding = Literal["round", "ceil", "aggregate-then-round"]
Identity = Literal["category1", "migrantGeneral", "migrantDomestic"]
SupplementaryType = Literal["bonus", "parttime", "professional", "dividend", "interest", "rent"]


@dataclass
class CalculateInput:
    monthly_salary: float
    identity: Identity = "category1"
    dependents: float = 0
    employment_insurance: bool = True
    pension_self_contribution: float = 0.0
    occupational_rate: Optional[float] = None
    part_time: bool = False
    rounding: Rounding = "round"


@dataclass
class SupplementaryInput:
    type: SupplementaryType
    amount: float
    monthly_insured_salary: Optional[float] = None
    ytd_bonus: float = 0
    rounding: Rounding = "round"


@dataclass
class ProratedInput:
    monthly_salary: float
    identity: Identity = "category1"
    dependents: float = 0
    employment_insurance: bool = True
    pension_self_contribution: float = 0.0
    occupational_rate: Optional[float] = None
    part_time: bool = False
    rounding: Rounding = "round"
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@dataclass
class Brackets:
    labor: int
    health: int
    pension: int
    occupational: int


@dataclass
class Employee:
    labor: int
    health: int
    pension_self: int
    total: int


@dataclass
class Employer:
    labor: int
    health: int
    pension: int
    occupational: int
    total: int


@dataclass
class Government:
    labor: int
    health: int


@dataclass
class Meta:
    year: int
    data_version: str


@dataclass
class CalculateResult:
    brackets: Brackets
    employee: Employee
    employer: Employer
    government: Government
    meta: Meta


@dataclass
class SupplementaryResult:
    type: SupplementaryType
    chargeable: int
    rate: str
    premium: int


@dataclass
class Days:
    insured: int


@dataclass
class ProratedResult(CalculateResult):
    days: Days
    health_charged: bool


@dataclass
class EmployerSupplementaryInput:
    monthly_paid_total: float
    monthly_insured_total: float
    rounding: Rounding = "round"


@dataclass
class EmployerSupplementaryResult:
    base: int
    rate: str
    premium: int
