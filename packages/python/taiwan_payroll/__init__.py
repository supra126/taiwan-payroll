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
from .media.supplementary_bonus_filing import (
    generate_supplementary_bonus_filing,
    to_big5_bytes,
    SupplementaryBonusFilingUnit,
    SupplementaryBonusRecord,
    SupplementaryBonusFilingInput,
    SupplementaryBonusFilingResult,
)
from .media.supplementary_parttime_filing import (
    generate_supplementary_parttime_filing,
    SupplementaryParttimeRecord,
    SupplementaryParttimeFilingInput,
)
from .media.supplementary_professional_filing import (
    generate_supplementary_professional_filing,
    SupplementaryProfessionalRecord,
    SupplementaryProfessionalFilingInput,
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
    "generate_supplementary_bonus_filing",
    "to_big5_bytes",
    "SupplementaryBonusFilingUnit",
    "SupplementaryBonusRecord",
    "SupplementaryBonusFilingInput",
    "SupplementaryBonusFilingResult",
    "generate_supplementary_parttime_filing",
    "SupplementaryParttimeRecord",
    "SupplementaryParttimeFilingInput",
    "generate_supplementary_professional_filing",
    "SupplementaryProfessionalRecord",
    "SupplementaryProfessionalFilingInput",
]
