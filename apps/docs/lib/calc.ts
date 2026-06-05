import { createPayrollEngine } from 'taiwan-payroll';
import type {
  CalculateInput,
  CalculateResult,
  Identity,
  Rounding,
  SupplementaryInput,
  SupplementaryResult,
  SupplementaryType,
  ProratedInput,
  ProratedResult,
} from 'taiwan-payroll';

export type Run<T> = { ok: true; result: T } | { ok: false; error: string };

/** 家事移工的職災費率（0.18%）；其餘身份用該年度平均費率。 */
const DOMESTIC_OCCUPATIONAL_RATE = 0.0018;

export interface PayrollForm {
  year: number;
  monthlySalary: string;
  identity: Identity;
  partTime: boolean;
  dependents: string;
  employmentInsurance: boolean;
  pensionSelfContribution: string; // decimal rate string, e.g. "0.06"
  rounding: Rounding;
}

export interface SupplementaryForm {
  year: number;
  type: SupplementaryType;
  amount: string;
  monthlyInsuredSalary: string; // bonus only
  ytdBonus: string; // bonus only
  rounding: Rounding;
}

export interface ProratedForm {
  year: number;
  monthlySalary: string;
  identity: Identity;
  partTime: boolean;
  dependents: string;
  employmentInsurance: boolean;
  pensionSelfContribution: string;
  rounding: Rounding;
  startDate: string;
  endDate: string;
}

/** 依身份別決定職災費率覆寫：家事移工 0.18%，其餘用該年度平均費率（undefined）。 */
const occRateFor = (identity: Identity): number | undefined =>
  identity === 'migrantDomestic' ? DOMESTIC_OCCUPATIONAL_RATE : undefined;

export interface Row {
  label: string;
  employee?: number;
  employer?: number;
  government?: number;
}

const numOr = (s: string, fallback: number): number => (s.trim() === '' ? fallback : Number(s));

function attempt<T>(fn: () => T): Run<T> {
  try {
    return { ok: true, result: fn() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function runCalculate(form: PayrollForm): Run<CalculateResult> {
  return attempt(() => {
    const input: CalculateInput = {
      monthlySalary: Number(form.monthlySalary),
      identity: form.identity,
      partTime: form.partTime,
      dependents: numOr(form.dependents, 0),
      employmentInsurance: form.employmentInsurance,
      pensionSelfContribution: numOr(form.pensionSelfContribution, 0),
      occupationalRate: occRateFor(form.identity),
      rounding: form.rounding,
    };
    return createPayrollEngine({ year: form.year }).calculate(input);
  });
}

export function runSupplementary(form: SupplementaryForm): Run<SupplementaryResult> {
  return attempt(() => {
    const input: SupplementaryInput = { type: form.type, amount: Number(form.amount), rounding: form.rounding };
    if (form.type === 'bonus') {
      input.monthlyInsuredSalary = form.monthlyInsuredSalary.trim() === '' ? undefined : Number(form.monthlyInsuredSalary);
      input.ytdBonus = numOr(form.ytdBonus, 0);
    }
    return createPayrollEngine({ year: form.year }).calculateSupplementary(input);
  });
}

export function runProrated(form: ProratedForm): Run<ProratedResult> {
  return attempt(() => {
    const input: ProratedInput = {
      monthlySalary: Number(form.monthlySalary),
      identity: form.identity,
      partTime: form.partTime,
      dependents: numOr(form.dependents, 0),
      employmentInsurance: form.employmentInsurance,
      pensionSelfContribution: numOr(form.pensionSelfContribution, 0),
      occupationalRate: occRateFor(form.identity),
      rounding: form.rounding,
      startDate: form.startDate.trim() === '' ? undefined : form.startDate,
      endDate: form.endDate.trim() === '' ? undefined : form.endDate,
    };
    return createPayrollEngine({ year: form.year }).calculateProrated(input);
  });
}

export function toRows(r: CalculateResult): Row[] {
  return [
    { label: '勞保（含就保）', employee: r.employee.labor, employer: r.employer.labor, government: r.government.labor },
    { label: '健保', employee: r.employee.health, employer: r.employer.health, government: r.government.health },
    { label: '勞退', employee: r.employee.pensionSelf, employer: r.employer.pension },
    { label: '職災', employer: r.employer.occupational },
    { label: '合計', employee: r.employee.total, employer: r.employer.total },
  ];
}
