// Hand-written to mirror data/schema.json. Codegen from schema is deferred to M2.

export interface Bracket {
  grade: number;
  min: number;
  max: number | null;
  insuredSalary: number;
}

export interface Burden {
  employer: string;
  employee: string;
  government: string;
}

export interface YearData {
  year: number;
  rocYear?: number;
  effectiveDate: string;
  dataVersion: string;
  minimumWage: { monthly: number; hourly: number };
  laborInsurance: {
    rate: string;
    rateWithoutEmploymentInsurance: string;
    burden: Burden;
    brackets: Bracket[];
    partTimeBrackets?: Bracket[];
  };
  occupationalInsurance: { defaultRate: string; brackets: Bracket[] };
  healthInsurance: {
    rate: string;
    burden: Burden;
    avgDependents: string;
    employerMultiplier: string;
    maxDependentsCharged: number;
    brackets: Bracket[];
    partTimeBrackets?: Bracket[];
  };
  pension: { employerRate: string; brackets: Bracket[] };
  supplementaryPremium: {
    rate: string;
    bonusThresholdMultiplier: number;
    lowerThreshold: number;
    singlePaymentCap: number;
  };
  incomeTax?: IncomeTax;
}

export type Identity = 'category1' | 'migrantGeneral' | 'migrantDomestic';
export type Rounding = 'round' | 'ceil' | 'aggregate-then-round';

export interface CalculateInput {
  monthlySalary: number;
  identity?: Identity; // default 'category1'
  dependents?: number; // health dependents, default 0, charged cap from data
  employmentInsurance?: boolean; // default true
  pensionSelfContribution?: number; // self提繳 rate 0..0.06, default 0
  occupationalRate?: number; // 職災行業別費率（小數比例），預設 data.occupationalInsurance.defaultRate
  partTime?: boolean; // 部分工時：未達基本工資者勞保/健保適用低級距（職保仍歸第1類），預設 false
  rounding?: Rounding; // default 'round'
}

export interface CalculateResult {
  brackets: { labor: number; health: number; pension: number; occupational: number };
  employee: { labor: number; health: number; pensionSelf: number; total: number };
  employer: { labor: number; health: number; pension: number; occupational: number; total: number };
  government: { labor: number; health: number };
  meta: { year: number; dataVersion: string };
}

export type SupplementaryType = 'bonus' | 'parttime' | 'professional' | 'dividend' | 'interest' | 'rent';

export interface SupplementaryInput {
  type: SupplementaryType;
  amount: number;
  monthlyInsuredSalary?: number; // bonus: this payment's current-month insured amount
  ytdBonus?: number; // bonus: cumulative bonuses paid before this one (default 0)
  rounding?: Rounding;
}

export interface SupplementaryResult {
  type: SupplementaryType;
  chargeable: number;
  rate: string;
  premium: number;
}

export interface ProratedInput extends CalculateInput {
  startDate?: string; // 'YYYY-MM-DD' 到職日
  endDate?: string; // 'YYYY-MM-DD' 離職日
}

export interface ProratedResult extends CalculateResult {
  days: { insured: number };
  healthCharged: boolean;
}

export interface EmployerSupplementaryInput {
  monthlyPaidTotal: number; // A：每月支付薪資所得總額
  monthlyInsuredTotal: number; // B：受僱者當月健保投保金額總額
  rounding?: Rounding; // default 'round'
}

export interface EmployerSupplementaryResult {
  base: number; // max(0, A − B)
  rate: string; // 補充保險費率，如 '0.0211'
  premium: number;
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

export type WithholdingInput =
  | { type: 'resident'; monthlySalary: number; dependents?: number }
  | { type: 'residentBonus'; amount: number }
  | { type: 'nonResident'; monthlySalary: number };

export interface WithholdingResult {
  withholding: number; // 每月（或該筆）應扣繳稅額，整數元
  rate: string; // 適用稅率字串
  taxableAnnual?: number; // 僅 resident：估計全年應稅薪資所得
}
