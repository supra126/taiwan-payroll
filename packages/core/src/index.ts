import type {
  CalculateInput,
  CalculateResult,
  YearData,
  SupplementaryInput,
  SupplementaryResult,
  ProratedInput,
  ProratedResult,
  EmployerSupplementaryInput,
  EmployerSupplementaryResult,
  WithholdingInput,
  WithholdingResult,
} from './types';
import { getYearData } from './data';
import { calcLaborInsurance } from './engine/laborInsurance';
import { calcHealthInsurance } from './engine/healthInsurance';
import { calcPension } from './engine/pension';
import { calcOccupational } from './engine/occupational';
import { calcSupplementary } from './engine/supplementary';
import { calcEmployerSupplementary } from './engine/employerSupplementary';
import { calcWithholding } from './engine/withholding';
import { calcProrated } from './engine/prorated';
import { numberToRateString } from './rounding/strategies';
import { getIdentityRules } from './identity';

export * from './types';
export { getYearData, getAvailableYears } from './data';
export { generateSupplementaryBonusFiling } from './media/supplementaryBonusFiling';

/** Validate the numeric/identity inputs shared by calculate() and calculateProrated(). */
function validateBaseInput(input: CalculateInput): void {
  if (!Number.isFinite(input.monthlySalary) || input.monthlySalary < 0) {
    throw new Error(`monthlySalary must be a finite non-negative number, got ${input.monthlySalary}`);
  }
  if (input.dependents !== undefined && !Number.isFinite(input.dependents)) {
    throw new Error(`dependents must be a finite number, got ${input.dependents}`);
  }
  if (input.pensionSelfContribution !== undefined && !Number.isFinite(input.pensionSelfContribution)) {
    throw new Error(`pensionSelfContribution must be a finite number, got ${input.pensionSelfContribution}`);
  }
  getIdentityRules(input.identity ?? 'category1'); // throws for an unknown identity
}

export interface PayrollEngine {
  calculate(input: CalculateInput): CalculateResult;
  calculateSupplementary(input: SupplementaryInput): SupplementaryResult;
  calculateEmployerSupplementary(input: EmployerSupplementaryInput): EmployerSupplementaryResult;
  calculateWithholding(input: WithholdingInput): WithholdingResult;
  calculateProrated(input: ProratedInput): ProratedResult;
}

export function createPayrollEngine(opts: { year: number }): PayrollEngine {
  const data: YearData = getYearData(opts.year);

  function resolveOccupationalRate(occupationalRate?: number): string {
    if (occupationalRate === undefined) return data.occupationalInsurance.defaultRate;
    if (!Number.isFinite(occupationalRate) || occupationalRate < 0 || occupationalRate >= 0.02) {
      throw new Error(`occupationalRate must be a fraction in [0, 0.02), got ${occupationalRate}`);
    }
    return numberToRateString(occupationalRate);
  }

  return {
    calculate(input: CalculateInput): CalculateResult {
      validateBaseInput(input);
      const rules = getIdentityRules(input.identity ?? 'category1');
      const rounding = input.rounding ?? 'round';
      const dependents = input.dependents ?? 0;
      const selfRate = input.pensionSelfContribution ?? 0;
      const partTime = input.partTime ?? false;
      const occupationalRate = resolveOccupationalRate(input.occupationalRate);
      const employmentInsurance = rules.employmentInsuranceAllowed ? (input.employmentInsurance ?? true) : false;

      const labor = rules.laborApplies
        ? calcLaborInsurance(data, input.monthlySalary, employmentInsurance, rounding, partTime)
        : { insured: 0, employee: 0, employer: 0, government: 0 };
      const health = calcHealthInsurance(data, input.monthlySalary, dependents, rounding, partTime);
      const pension = rules.pensionApplies
        ? calcPension(data, input.monthlySalary, selfRate, rounding)
        : { insured: 0, employer: 0, self: 0 };
      const occupational = calcOccupational(data, input.monthlySalary, occupationalRate, rounding);

      return {
        brackets: {
          labor: labor.insured,
          health: health.insured,
          pension: pension.insured,
          occupational: occupational.insured,
        },
        employee: {
          labor: labor.employee,
          health: health.employee,
          pensionSelf: pension.self,
          total: labor.employee + health.employee + pension.self,
        },
        employer: {
          labor: labor.employer,
          health: health.employer,
          pension: pension.employer,
          occupational: occupational.employer,
          total: labor.employer + health.employer + pension.employer + occupational.employer,
        },
        government: { labor: labor.government, health: health.government },
        meta: { year: data.year, dataVersion: data.dataVersion },
      };
    },

    calculateSupplementary(input: SupplementaryInput): SupplementaryResult {
      return calcSupplementary(data, input, input.rounding ?? 'round');
    },

    calculateEmployerSupplementary(input: EmployerSupplementaryInput): EmployerSupplementaryResult {
      return calcEmployerSupplementary(data, input, input.rounding ?? 'round');
    },

    calculateWithholding(input: WithholdingInput): WithholdingResult {
      return calcWithholding(data, input);
    },

    calculateProrated(input: ProratedInput): ProratedResult {
      validateBaseInput(input);
      const occupationalRate = resolveOccupationalRate(input.occupationalRate);
      return calcProrated(data, input, occupationalRate);
    },
  };
}
