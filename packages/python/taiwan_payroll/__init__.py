from importlib.metadata import PackageNotFoundError, version as _pkg_version

from ._data import get_available_years, get_year_data
from ._engine import create_payroll_engine, PayrollEngine
from .engine.supplementary import calc_dividend_premium
from .engine.old_age_pension import (
    calc_old_age_pension,
    average_highest_insured_salary,
    statutory_claim_age,
)
from .engine.old_age_lump_sum import calc_old_age_lump_sum
from .engine.old_age_single_payment import calc_old_age_single_payment

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
    OldAgePensionInput,
    OldAgePensionResult,
    OldAgeLumpSumInput,
    OldAgeLumpSumResult,
    OldAgeSinglePaymentInput,
    OldAgeSinglePaymentResult,
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
from .media.supplementary_interest_filing import (
    generate_supplementary_interest_filing,
    SupplementaryInterestFilingInput,
)
from .media.supplementary_rent_filing import (
    generate_supplementary_rent_filing,
    SupplementaryRentFilingInput,
)
from .media.supplementary_dividend_filing import (
    generate_supplementary_dividend_filing,
    SupplementaryDividendRecord,
    SupplementaryDividendFilingInput,
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
    "OldAgePensionInput",
    "OldAgePensionResult",
    "OldAgeLumpSumInput",
    "OldAgeLumpSumResult",
    "OldAgeSinglePaymentInput",
    "OldAgeSinglePaymentResult",
    "calc_old_age_pension",
    "calc_old_age_lump_sum",
    "calc_old_age_single_payment",
    "average_highest_insured_salary",
    "statutory_claim_age",
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
    "generate_supplementary_interest_filing",
    "SupplementaryInterestFilingInput",
    "generate_supplementary_rent_filing",
    "SupplementaryRentFilingInput",
    "calc_dividend_premium",
    "generate_supplementary_dividend_filing",
    "SupplementaryDividendRecord",
    "SupplementaryDividendFilingInput",
]
