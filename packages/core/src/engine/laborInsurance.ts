import type { YearData, Rounding } from '../types';
import { findBracket, bracketsFor } from '../lookup/bracket';
import { applyRate } from '../rounding/strategies';

export interface LaborResult {
  insured: number;
  employee: number;
  employer: number;
  government: number;
}

/**
 * 勞保＋就保. Combined rate 12.5% (普通事故 11.5% ＋ 就保 1%); 11.5% when employmentInsurance=false.
 * Each party's premium = round(insured × rate × burdenShare). Burden: employer .7 / employee .2 / gov .1.
 * Source anchor: 最低級距 29,500 × 12.5% × 20% = 737.5 → 738 元 (勞保局/新聞稿).
 */
export function calcLaborInsurance(
  data: YearData,
  monthlySalary: number,
  employmentInsurance: boolean,
  rounding: Rounding,
  partTime = false,
): LaborResult {
  const li = data.laborInsurance;
  const insured = findBracket(bracketsFor(li.brackets, li.partTimeBrackets, partTime), monthlySalary).insuredSalary;
  const rate = employmentInsurance ? li.rate : li.rateWithoutEmploymentInsurance;
  if (rounding === 'aggregate-then-round') {
    // Round the full premium once, then let government absorb the split remainder.
    const total = applyRate(insured, [rate], 'round');
    const employee = applyRate(insured, [rate, li.burden.employee], 'round');
    const employer = applyRate(insured, [rate, li.burden.employer], 'round');
    return { insured, employee, employer, government: total - employee - employer };
  }
  return {
    insured,
    employee: applyRate(insured, [rate, li.burden.employee], rounding),
    employer: applyRate(insured, [rate, li.burden.employer], rounding),
    government: applyRate(insured, [rate, li.burden.government], rounding),
  };
}
