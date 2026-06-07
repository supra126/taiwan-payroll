// AUTO-GENERATED from data/schema.json by scripts/gen-types.ts — do not edit by hand.
// Run `pnpm gen:types` to regenerate after changing the schema.

export interface Burden {
  employer: string;
  employee: string;
  government: string;
}

export interface Bracket {
  grade: number;
  min: number;
  max: number | null;
  insuredSalary: number;
}

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: string;
  progressiveDiff: number;
}

export interface IncomeTax {
  residentExemption: number;
  standardDeduction: number;
  salaryDeduction: number;
  brackets: TaxBracket[];
  nonMonthly: { rate: string; threshold: number };
  nonResident: { rate: string; reducedRate: string; reducedThresholdMultiplier: number };
}

export interface OldAgePension {
  formulaARate: string;
  formulaABonus: number;
  formulaBRate: string;
  adjustPerYearRate: string;
  maxAdjustYears: number;
  minYearsForPension: number;
  lumpSumPostAgeCapYears: number;
  singlePaymentBasis: { firstTierYears: number; firstTierBasisPerYear: number; secondTierBasisPerYear: number; preSixtyMaxBasis: number; postSixtyCapYears: number; combinedMaxBasis: number };
  statutoryAge: { schedule: { maxBornRocYear: number; age: number }[]; defaultAge: number };
}

export interface YearData {
  year: number;
  rocYear?: number;
  effectiveDate: string;
  dataVersion: string;
  sources: Record<string, unknown>[];
  minimumWage: { monthly: number; hourly: number };
  laborInsurance: { rate: string; rateWithoutEmploymentInsurance: string; burden: Burden; brackets: Bracket[]; partTimeBrackets?: Bracket[] };
  occupationalInsurance: { defaultRate: string; brackets: Bracket[] };
  healthInsurance: { rate: string; burden: Burden; avgDependents: string; employerMultiplier: string; maxDependentsCharged: number; brackets: Bracket[]; partTimeBrackets?: Bracket[] };
  pension: { employerRate: string; brackets: Bracket[] };
  supplementaryPremium: { rate: string; bonusThresholdMultiplier: number; lowerThreshold: number; singlePaymentCap: number };
  incomeTax?: IncomeTax;
  oldAgePension?: OldAgePension;
}
