import type { YearData, Rounding } from '../types';
import { findBracket } from '../lookup/bracket';
import { applyRate } from '../rounding/strategies';

export interface OccupationalResult {
  insured: number;
  employer: number;
}

/**
 * 職災保險（職保）. Employer-only. employer = round(insured × occupationalRate).
 * occupationalRate is a decimal-string fraction (default data.occupationalInsurance.defaultRate, 0.0021).
 * Source: 勞工職業災害保險及保護法§17；115 平均費率 0.21%.
 */
export function calcOccupational(
  data: YearData,
  monthlySalary: number,
  occupationalRate: string,
  rounding: Rounding,
): OccupationalResult {
  const oi = data.occupationalInsurance;
  const insured = findBracket(oi.brackets, monthlySalary).insuredSalary;
  return { insured, employer: applyRate(insured, [occupationalRate], rounding) };
}
