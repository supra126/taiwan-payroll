import type { YearData, Rounding } from '../types';
import { findBracket, bracketsFor } from '../lookup/bracket';
import { applyRate } from '../rounding/strategies';

export interface HealthResult {
  insured: number;
  employee: number; // 本人 + 計費眷屬 (per-person premium rounded then multiplied)
  employer: number;
  government: number;
}

/**
 * 健保 第1類受僱者. Per-person rounding:
 *   perPerson = round(insured × 5.17% × 30%); employee = perPerson × (1 + dependents),
 *   dependents capped at maxDependentsCharged.
 *   employer = round(insured × 5.17% × 60% × 1.56); government = round(insured × 5.17% × 10% × 1.56).
 * Verified against 健保署 保險費負擔金額表 (2026): grade1 458/1428/238, grade9 651/2032/339, grade9+1眷 1302.
 */
export function calcHealthInsurance(
  data: YearData,
  monthlySalary: number,
  dependents: number,
  rounding: Rounding,
  partTime = false,
): HealthResult {
  const hi = data.healthInsurance;
  const insured = findBracket(bracketsFor(hi.brackets, hi.partTimeBrackets, partTime), monthlySalary).insuredSalary;
  // Floor so a non-integer dependents count can never yield a fractional (non-integer NTD) premium.
  const charged = Math.min(Math.floor(Math.max(dependents, 0)), hi.maxDependentsCharged);
  const perPerson = applyRate(insured, [hi.rate, hi.burden.employee], rounding);
  return {
    insured,
    employee: perPerson * (1 + charged),
    employer: applyRate(insured, [hi.rate, hi.burden.employer, hi.employerMultiplier], rounding),
    government: applyRate(insured, [hi.rate, hi.burden.government, hi.employerMultiplier], rounding),
  };
}
