// Data-shape types (YearData, Bracket, Burden, IncomeTax, TaxBracket) are GENERATED from
// data/schema.json — see ./types.generated.ts (run `pnpm gen:types` after changing the schema).
// The API input/result types below are hand-written.
export type { Bracket, Burden, YearData, TaxBracket, IncomeTax } from './types.generated';

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

export type WithholdingInput =
  | { type: 'resident'; monthlySalary: number; dependents?: number }
  | { type: 'residentBonus'; amount: number }
  | { type: 'nonResident'; monthlySalary: number };

export interface WithholdingResult {
  withholding: number; // 每月（或該筆）應扣繳稅額，整數元
  rate: string; // 適用稅率字串
  taxableAnnual?: number; // 僅 resident：估計全年應稅薪資所得
}

export interface SupplementaryBonusFilingUnit {
  taxId: string;
  name: string;
  phone: string;
  email: string;
  contactName: string;
}
export interface SupplementaryBonusRecord {
  action: 'I' | 'R';
  payDate: string; // 'YYYYMMDD' 西元
  payeeId: string;
  payeeName: string;
  bonusAmount: number;
  insuredSalary: number;
  ytdBonusCumulative: number; // 含本筆
  unitCode: string;
  filingNo?: string; // 預設 '1'
  note?: string; // 預設 ''
}
export interface SupplementaryBonusFilingInput {
  year: number; // 費率年度（2024–2026）
  unit: SupplementaryBonusFilingUnit;
  filingDate: string; // 'YYYYMMDD' 西元（僅用於檔名）
  sequence?: string; // 預設 '001'
  records: SupplementaryBonusRecord[];
}
export interface SupplementaryBonusFilingResult {
  filename: string;
  content: string; // Unicode CSV（存檔以 Big5 編碼）
}
export interface SupplementaryParttimeRecord {
  action: 'I' | 'R';
  payDate: string; // 'YYYYMMDD'
  payeeId: string;
  payeeName: string;
  amount: number; // 單次給付金額
  filingNo?: string; // 申報編號，預設 '1'
  trustNote?: string; // 信託註記，預設 ''
  note?: string; // 資料註記，預設 ''
}
export interface SupplementaryParttimeFilingInput {
  year: number; // 費率＋基本工資年度（2024–2026）
  unit: SupplementaryBonusFilingUnit; // 與獎金同結構
  filingDate: string; // 'YYYYMMDD'
  sequence?: string; // 預設 '001'
  records: SupplementaryParttimeRecord[];
}
// 結果型別重用 SupplementaryBonusFilingResult（{ filename, content }）。
export interface SupplementaryProfessionalRecord {
  action: 'I' | 'R';
  payDate: string; // 'YYYYMMDD'
  payeeId: string;
  payeeName: string;
  amount: number; // 單次給付金額
  filingNo?: string; // 預設 '1'
  trustNote?: string; // 信託註記，預設 ''
  note?: string; // 資料註記，預設 ''
  incomeYear?: string; // 所得所屬年度，預設 ''
}
export interface SupplementaryProfessionalFilingInput {
  year: number; // 費率年度（2024–2026）
  unit: SupplementaryBonusFilingUnit;
  filingDate: string; // 'YYYYMMDD'
  sequence?: string; // 預設 '001'
  records: SupplementaryProfessionalRecord[];
}
// 結果重用 SupplementaryBonusFilingResult。
export interface SupplementaryInterestFilingInput {
  year: number;
  unit: SupplementaryBonusFilingUnit;
  filingDate: string;
  sequence?: string;
  records: SupplementaryParttimeRecord[];
}
export interface SupplementaryRentFilingInput {
  year: number;
  unit: SupplementaryBonusFilingUnit;
  filingDate: string;
  sequence?: string;
  records: SupplementaryParttimeRecord[];
}
export interface SupplementaryDividendRecord {
  action: 'I' | 'R';
  payDate: string; // 'YYYYMMDD' 西元
  payeeId: string;
  payeeName: string;
  amount: number; // 單次給付金額
  premium: number; // 扣繳補充保險費金額（呼叫端提供，可用 calcDividendPremium 算常見情況）
  exDividendDate: string; // 除權(息)基準日 'YYYYMMDD' 西元
  dividendType: '1' | '2' | '3'; // 股利註記：1股票/2現金/3同基準日兩者
  filingNo?: string; // 預設 '1'
  trustNote?: string; // 信託註記 T/G，預設 ''
  creditableTaxWithholding?: number; // 扣取時可扣抵稅額，預設 0（107年後為0）
  creditableTaxFinal?: number; // 年度確定可扣抵稅額，預設 0
  employerInsuredTotal?: number; // 股利所屬期間雇主身分投保額總額（雇主才填）
  specialNote?: string; // 特殊註記 B/C/E/H/M，預設 ''
  belongingPeriod?: string; // 股利所屬期間起迄年月（民國 yyymmyyymm，雇主才填）預設 ''
  belongingYear?: string; // 股利所屬年度（民國 yyy，雇主才填）預設 ''
}
export interface SupplementaryDividendFilingInput {
  unit: SupplementaryBonusFilingUnit;
  filingDate: string; // 'YYYYMMDD'
  sequence?: string; // 預設 '001'
  records: SupplementaryDividendRecord[];
}
// 結果重用 SupplementaryBonusFilingResult。

export interface OldAgePensionInput {
  avgInsuredSalary: number; // 平均月投保薪資
  years: number; // 年資：年
  months?: number; // 年資：月（0–11，預設 0）
  claimOffsetMonths?: number; // 提前(負)/延後(正)月（相對法定年齡，預設 0）
}
export interface OldAgePensionResult {
  formulaA: number;
  formulaB: number;
  monthly: number;
  adjustmentMonths: number;
  eligible: boolean;
}

export interface OldAgeLumpSumInput {
  avgInsuredSalary: number;
  years: number;
  months?: number;
  postSixtyMonths?: number;
}
export interface OldAgeLumpSumResult {
  payment: number;
  insuredMonthsCounted: number;
}

export interface OldAgeSinglePaymentInput {
  avgInsuredSalary: number;
  preSixtyYears: number;
  preSixtyMonths?: number;
  postSixtyYears?: number;
  postSixtyMonths?: number;
}
export interface OldAgeSinglePaymentResult {
  payment: number;
  basisTwelfths: number;
}
