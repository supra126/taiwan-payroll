import type { YearData, Rounding } from '../types';
import { findBracket } from '../lookup/bracket';
import { applyRate, numberToRateString } from '../rounding/strategies';

export interface PensionResult {
  insured: number;
  employer: number;
  self: number;
}

/**
 * 勞退. Uses the pension month-contribution table (cap 150,000).
 *   employer = round(insured × 6%); self = round(insured × selfRate), selfRate ∈ [0, 0.06].
 */
export function calcPension(
  data: YearData,
  monthlySalary: number,
  selfContributionRate: number,
  rounding: Rounding,
): PensionResult {
  const p = data.pension;
  const insured = findBracket(p.brackets, monthlySalary).insuredSalary;
  const clampedRate = Math.min(Math.max(selfContributionRate, 0), 0.06);
  // numberToRateString uses toFixed(10) to avoid scientific notation (e.g. "1e-8") that
  // parseRate would reject; 10 decimals is finer than any real提繳率.
  const selfRate = numberToRateString(clampedRate);
  return {
    insured,
    employer: applyRate(insured, [p.employerRate], rounding),
    self: clampedRate > 0 ? applyRate(insured, [selfRate], rounding) : 0,
  };
}
