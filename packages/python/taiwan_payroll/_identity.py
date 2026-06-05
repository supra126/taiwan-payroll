from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class IdentityRules:
    labor_applies: bool
    pension_applies: bool
    employment_insurance_allowed: bool


IDENTITY_RULES = {
    "category1": IdentityRules(True, True, True),
    "migrantGeneral": IdentityRules(True, False, False),
    "migrantDomestic": IdentityRules(False, False, False),
}


def get_identity_rules(identity: str) -> IdentityRules:
    rules = IDENTITY_RULES.get(identity)
    if rules is None:
        raise ValueError(f'Unsupported identity "{identity}". Supported: {", ".join(IDENTITY_RULES)}.')
    return rules
