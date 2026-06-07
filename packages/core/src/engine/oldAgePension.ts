import type { YearData, OldAgePensionInput, OldAgePensionResult } from '../types';
import { parseRate, roundHalfUp } from '../rounding/strategies';

function assertNonNeg(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be a finite non-negative number, got ${v}`);
}

export function calcOldAgePension(data: YearData, input: OldAgePensionInput): OldAgePensionResult {
  const oap = data.oldAgePension;
  if (!oap) throw new Error(`No oldAgePension data for year ${data.year}（該年度無老年年金資料）`);
  const months = input.months ?? 0;
  const offset = input.claimOffsetMonths ?? 0;
  assertNonNeg('avgInsuredSalary', input.avgInsuredSalary);
  assertNonNeg('years', input.years);
  assertNonNeg('months', months);
  if (months > 11 || !Number.isInteger(months)) throw new Error(`months must be an integer 0–11, got ${months}`);
  if (!Number.isInteger(input.years)) throw new Error(`years must be an integer, got ${input.years}`);
  if (!Number.isInteger(offset)) throw new Error(`claimOffsetMonths must be an integer, got ${offset}`);

  const M = input.years * 12 + months;
  const cap = oap.maxAdjustYears * 12;
  const adjMonths = Math.max(-cap, Math.min(cap, offset));
  const a = parseRate(oap.adjustPerYearRate); // {num:4, den:100}
  const factorN = 12 * a.den + adjMonths * a.num;
  const factorD = 12 * a.den;

  const ra = parseRate(oap.formulaARate); // {num:775, den:100000}
  const formulaA = roundHalfUp(
    (input.avgInsuredSalary * M * ra.num + oap.formulaABonus * 12 * ra.den) * factorN,
    12 * ra.den * factorD,
  );
  const rb = parseRate(oap.formulaBRate); // {num:155, den:10000}
  const formulaB = roundHalfUp(input.avgInsuredSalary * M * rb.num * factorN, 12 * rb.den * factorD);

  return {
    formulaA,
    formulaB,
    monthly: Math.max(formulaA, formulaB),
    adjustmentMonths: adjMonths,
    eligible: M >= oap.minYearsForPension * 12,
  };
}

export function averageHighestInsuredSalary(monthlySalaries: number[]): number {
  if (monthlySalaries.length === 0) throw new Error('monthlySalaries must not be empty');
  monthlySalaries.forEach((s, i) => assertNonNeg(`monthlySalaries[${i}]`, s));
  const top = [...monthlySalaries].sort((x, y) => y - x).slice(0, 60);
  return roundHalfUp(
    top.reduce((s, v) => s + v, 0),
    top.length,
  );
}

export function statutoryClaimAge(data: YearData, bornRocYear: number): number {
  const sa = data.oldAgePension?.statutoryAge;
  if (!sa) throw new Error(`No oldAgePension data for year ${data.year}`);
  const hit = sa.schedule.find((e) => bornRocYear <= e.maxBornRocYear);
  return hit ? hit.age : sa.defaultAge;
}
