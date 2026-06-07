import type { YearData, OldAgeLumpSumInput, OldAgeLumpSumResult } from '../types';
import { roundHalfUp } from '../rounding/strategies';

function assertNonNegInt(name: string, v: number): void {
  if (!Number.isInteger(v) || v < 0) {
    throw new Error(`${name} must be a non-negative integer, got ${v}`);
  }
}

export function calcOldAgeLumpSum(data: YearData, input: OldAgeLumpSumInput): OldAgeLumpSumResult {
  const oap = data.oldAgePension;
  if (!oap) throw new Error(`No oldAgePension data for year ${data.year}（該年度無老年給付資料）`);
  const months = input.months ?? 0;
  const post60 = input.postSixtyMonths ?? 0;
  if (!Number.isFinite(input.avgInsuredSalary) || input.avgInsuredSalary < 0) {
    throw new Error(`avgInsuredSalary must be a finite non-negative number, got ${input.avgInsuredSalary}`);
  }
  assertNonNegInt('years', input.years);
  assertNonNegInt('months', months);
  assertNonNegInt('postSixtyMonths', post60);
  if (months > 11) throw new Error(`months must be 0–11, got ${months}`);
  const M = input.years * 12 + months;
  if (post60 > M) throw new Error(`postSixtyMonths (${post60}) must not exceed total insured months (${M})`);
  const cap = oap.lumpSumPostAgeCapYears * 12;
  const effective = M - post60 + Math.min(post60, cap);
  return {
    payment: roundHalfUp(input.avgInsuredSalary * effective, 12),
    insuredMonthsCounted: effective,
  };
}
