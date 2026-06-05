import type { Identity } from './types';

export interface IdentityRules {
  laborApplies: boolean;
  pensionApplies: boolean;
  employmentInsuranceAllowed: boolean; // false → 就保 never applies (勞保 11.5%); 健保/職災 always apply
}

export const IDENTITY_RULES: Record<Identity, IdentityRules> = {
  category1: { laborApplies: true, pensionApplies: true, employmentInsuranceAllowed: true },
  migrantGeneral: { laborApplies: true, pensionApplies: false, employmentInsuranceAllowed: false },
  migrantDomestic: { laborApplies: false, pensionApplies: false, employmentInsuranceAllowed: false },
};

export function getIdentityRules(identity: Identity): IdentityRules {
  const rules = IDENTITY_RULES[identity];
  if (!rules) {
    throw new Error(`Unsupported identity "${identity}". Supported: ${Object.keys(IDENTITY_RULES).join(', ')}.`);
  }
  return rules;
}
