import type { YearData, ProratedInput, ProratedResult } from '../types';
import { findBracket, bracketsFor } from '../lookup/bracket';
import { applyRateProrated, numberToRateString } from '../rounding/strategies';
import { getIdentityRules } from '../identity';
import { calcHealthInsurance } from './healthInsurance';

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const dayOfMonth = (d: string): number => parseInt(d.slice(8, 10), 10);
const yearMonth = (d: string): string => d.slice(0, 7);

function assertIsoDate(d: string): void {
  if (!ISO_DATE.test(d)) throw new Error(`Date must be in YYYY-MM-DD format, got "${d}"`);
}

/** Insured days (30-day basis) for 勞保/職保/勞退. Throws on no date / cross-month range / malformed date. */
export function computeInsuredDays(startDate?: string, endDate?: string): number {
  if (!startDate && !endDate) throw new Error('calculateProrated requires startDate or endDate');
  if (startDate) assertIsoDate(startDate);
  if (endDate) assertIsoDate(endDate);
  if (startDate && endDate && yearMonth(startDate) !== yearMonth(endDate)) {
    throw new Error('startDate and endDate must be in the same month');
  }
  if (startDate && endDate) {
    const s = Math.min(dayOfMonth(startDate), 30);
    const e = Math.min(dayOfMonth(endDate), 30);
    return clamp(e - s + 1, 0, 30);
  }
  if (startDate) return clamp(30 - Math.min(dayOfMonth(startDate), 30) + 1, 0, 30);
  return clamp(Math.min(dayOfMonth(endDate as string), 30), 0, 30);
}

/** 健保 月底歸屬: charged full month unless the employee leaves this month. */
export function healthChargedThisMonth(_startDate?: string, endDate?: string): boolean {
  return !endDate;
}

export function calcProrated(data: YearData, input: ProratedInput, occupationalRate: string): ProratedResult {
  const days = computeInsuredDays(input.startDate, input.endDate);
  const healthCharged = healthChargedThisMonth(input.startDate, input.endDate);
  const rounding = input.rounding ?? 'round';
  const rules = getIdentityRules(input.identity ?? 'category1');
  const employmentInsurance = rules.employmentInsuranceAllowed ? (input.employmentInsurance ?? true) : false;
  const dependents = input.dependents ?? 0;
  const selfRate = input.pensionSelfContribution ?? 0;
  const partTime = input.partTime ?? false;
  const salary = input.monthlySalary;

  const li = data.laborInsurance;
  let laborInsured = 0;
  let laborEmployee = 0;
  let laborEmployer = 0;
  let laborGov = 0;
  if (rules.laborApplies) {
    laborInsured = findBracket(bracketsFor(li.brackets, li.partTimeBrackets, partTime), salary).insuredSalary;
    const laborRate = employmentInsurance ? li.rate : li.rateWithoutEmploymentInsurance;
    if (rounding === 'aggregate-then-round') {
      // Mirror calcLaborInsurance: round the prorated total once, government absorbs the split remainder.
      const laborTotal = applyRateProrated(laborInsured, [laborRate], days, 30, 'round');
      laborEmployee = applyRateProrated(laborInsured, [laborRate, li.burden.employee], days, 30, 'round');
      laborEmployer = applyRateProrated(laborInsured, [laborRate, li.burden.employer], days, 30, 'round');
      laborGov = laborTotal - laborEmployee - laborEmployer;
    } else {
      laborEmployee = applyRateProrated(laborInsured, [laborRate, li.burden.employee], days, 30, rounding);
      laborEmployer = applyRateProrated(laborInsured, [laborRate, li.burden.employer], days, 30, rounding);
      laborGov = applyRateProrated(laborInsured, [laborRate, li.burden.government], days, 30, rounding);
    }
  }

  const occInsured = findBracket(data.occupationalInsurance.brackets, salary).insuredSalary;
  const occEmployer = applyRateProrated(occInsured, [occupationalRate], days, 30, rounding);

  let penInsured = 0;
  let penEmployer = 0;
  let penSelf = 0;
  if (rules.pensionApplies) {
    penInsured = findBracket(data.pension.brackets, salary).insuredSalary;
    penEmployer = applyRateProrated(penInsured, [data.pension.employerRate], days, 30, rounding);
    const clampedSelf = Math.min(Math.max(selfRate, 0), 0.06);
    penSelf = clampedSelf > 0 ? applyRateProrated(penInsured, [numberToRateString(clampedSelf)], days, 30, rounding) : 0;
  }

  const healthInsured = findBracket(
    bracketsFor(data.healthInsurance.brackets, data.healthInsurance.partTimeBrackets, partTime),
    salary,
  ).insuredSalary;
  const health = healthCharged
    ? calcHealthInsurance(data, salary, dependents, rounding, partTime)
    : { insured: healthInsured, employee: 0, employer: 0, government: 0 };

  return {
    brackets: { labor: laborInsured, health: healthInsured, pension: penInsured, occupational: occInsured },
    employee: {
      labor: laborEmployee,
      health: health.employee,
      pensionSelf: penSelf,
      total: laborEmployee + health.employee + penSelf,
    },
    employer: {
      labor: laborEmployer,
      health: health.employer,
      pension: penEmployer,
      occupational: occEmployer,
      total: laborEmployer + health.employer + penEmployer + occEmployer,
    },
    government: { labor: laborGov, health: health.government },
    meta: { year: data.year, dataVersion: data.dataVersion },
    days: { insured: days },
    healthCharged,
  };
}
