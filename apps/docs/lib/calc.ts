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
  WithholdingInput,
  WithholdingResult,
  EmployerSupplementaryInput,
  EmployerSupplementaryResult,
  OldAgePensionInput,
  OldAgePensionResult,
  OldAgeLumpSumInput,
  OldAgeLumpSumResult,
  OldAgeSinglePaymentInput,
  OldAgeSinglePaymentResult,
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

export interface WithholdingForm {
  year: number;
  type: WithholdingInput['type'];
  monthlySalary: string; // resident / nonResident
  dependents: string; // resident only
  amount: string; // residentBonus only
}

export interface EmployerSupplementaryForm {
  year: number;
  monthlyPaidTotal: string;
  monthlyInsuredTotal: string;
  rounding: Rounding;
}

export interface OldAgePensionForm {
  year: number;
  avgInsuredSalary: string;
  years: string;
  months: string;
  claimOffsetMonths: string;
}

export interface OldAgeLumpSumForm {
  year: number;
  avgInsuredSalary: string;
  years: string;
  months: string;
  postSixtyMonths: string;
}

export interface OldAgeSinglePaymentForm {
  year: number;
  avgInsuredSalary: string;
  preSixtyYears: string;
  preSixtyMonths: string;
  postSixtyYears: string;
  postSixtyMonths: string;
}

export interface Row {
  label: string;
  employee?: number;
  employer?: number;
  government?: number;
}

const numOr = (s: string, fallback: number): number => (s.trim() === '' ? fallback : Number(s));
/** 必填數值欄位：空字串回 NaN，讓 core 的有限數驗證明確拒絕（避免 Number('') === 0 靜默算成 0）。 */
const numReq = (s: string): number => numOr(s, NaN);

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
      monthlySalary: numReq(form.monthlySalary),
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
      monthlySalary: numReq(form.monthlySalary),
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

export function runWithholding(form: WithholdingForm): Run<WithholdingResult> {
  return attempt(() => {
    let input: WithholdingInput;
    if (form.type === 'residentBonus') {
      input = { type: 'residentBonus', amount: numReq(form.amount) };
    } else if (form.type === 'nonResident') {
      input = { type: 'nonResident', monthlySalary: numReq(form.monthlySalary) };
    } else {
      input = { type: 'resident', monthlySalary: numReq(form.monthlySalary), dependents: numOr(form.dependents, 0) };
    }
    return createPayrollEngine({ year: form.year }).calculateWithholding(input);
  });
}

export function runEmployerSupplementary(form: EmployerSupplementaryForm): Run<EmployerSupplementaryResult> {
  return attempt(() => {
    const input: EmployerSupplementaryInput = {
      monthlyPaidTotal: numReq(form.monthlyPaidTotal),
      monthlyInsuredTotal: numReq(form.monthlyInsuredTotal),
      rounding: form.rounding,
    };
    return createPayrollEngine({ year: form.year }).calculateEmployerSupplementary(input);
  });
}

export function runOldAgePension(form: OldAgePensionForm): Run<OldAgePensionResult> {
  return attempt(() => {
    const input: OldAgePensionInput = {
      avgInsuredSalary: numReq(form.avgInsuredSalary),
      years: numReq(form.years),
      months: numOr(form.months, 0),
      claimOffsetMonths: numOr(form.claimOffsetMonths, 0),
    };
    return createPayrollEngine({ year: form.year }).calculateOldAgePension(input);
  });
}

export function runOldAgeLumpSum(form: OldAgeLumpSumForm): Run<OldAgeLumpSumResult> {
  return attempt(() => {
    const input: OldAgeLumpSumInput = {
      avgInsuredSalary: numReq(form.avgInsuredSalary),
      years: numReq(form.years),
      months: numOr(form.months, 0),
      postSixtyMonths: numOr(form.postSixtyMonths, 0),
    };
    return createPayrollEngine({ year: form.year }).calculateOldAgeLumpSum(input);
  });
}

export function runOldAgeSinglePayment(form: OldAgeSinglePaymentForm): Run<OldAgeSinglePaymentResult> {
  return attempt(() => {
    const input: OldAgeSinglePaymentInput = {
      avgInsuredSalary: numReq(form.avgInsuredSalary),
      preSixtyYears: numReq(form.preSixtyYears),
      preSixtyMonths: numOr(form.preSixtyMonths, 0),
      postSixtyYears: numOr(form.postSixtyYears, 0),
      postSixtyMonths: numOr(form.postSixtyMonths, 0),
    };
    return createPayrollEngine({ year: form.year }).calculateOldAgeSinglePayment(input);
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
