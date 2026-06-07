from importlib.metadata import PackageNotFoundError, version as _pkg_version

from ._data import get_available_years, get_year_data
from ._engine import create_payroll_engine, PayrollEngine

try:
    __version__ = _pkg_version("taiwan-payroll")
except PackageNotFoundError:  # running from source without an installed dist
    __version__ = "0.0.0+dev"
from ._types import (
    CalculateInput,
    CalculateResult,
    SupplementaryInput,
    SupplementaryResult,
    ProratedInput,
    ProratedResult,
    EmployerSupplementaryInput,
    EmployerSupplementaryResult,
    WithholdingInput,
    WithholdingResult,
    Rounding,
    SupplementaryType,
    Identity,
)

__all__ = [
    "__version__",
    "create_payroll_engine",
    "PayrollEngine",
    "get_available_years",
    "get_year_data",
    "CalculateInput",
    "CalculateResult",
    "SupplementaryInput",
    "SupplementaryResult",
    "ProratedInput",
    "ProratedResult",
    "EmployerSupplementaryInput",
    "EmployerSupplementaryResult",
    "WithholdingInput",
    "WithholdingResult",
    "Rounding",
    "SupplementaryType",
    "Identity",
]
