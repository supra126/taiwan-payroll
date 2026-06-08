import type { YearData, WithholdingInput, WithholdingResult } from '../types';
import { applyRate, parseRate, roundHalfUp } from '../rounding/strategies';

function assertNonNeg(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) {
    throw new Error(`${name} must be a finite non-negative number, got ${v}`);
  }
}

/**
 * 薪資所得扣繳稅額。三條路徑：
 *  - resident：公式法。應稅=max(0, 月薪×12 − (免稅額×(1+扶養)+標準扣除+薪資扣除))；
 *    全年稅=max(0, round(應稅×率−累進差額))；每月=round(全年稅/12)。兩步皆 round-half-up。
 *  - residentBonus：非每月給付，達起扣標準按給付額 5%，否則 0。
 *  - nonResident：月薪 ≤ 1.5×基本工資 → 6%，否則 18%。
 * Source: 財政部 115 年度薪資所得扣繳稅額表說明／各類所得扣繳率標準。
 */
export function calcWithholding(data: YearData, input: WithholdingInput): WithholdingResult {
  const it = data.incomeTax;
  if (!it) throw new Error(`No incomeTax data for year ${data.year}（該年度無所得稅扣繳資料）`);

  if (input.type === 'resident') {
    assertNonNeg('monthlySalary', input.monthlySalary);
    const dependents = input.dependents ?? 0;
    assertNonNeg('dependents', dependents);
    const deductions = it.residentExemption * (1 + dependents) + it.standardDeduction + it.salaryDeduction;
    // 應稅所得以整數 NTD 計（與 Python 端 int() 契約一致）。
    const taxable = Math.floor(Math.max(0, input.monthlySalary * 12 - deductions));
    const bracket = it.brackets.find((b) => taxable >= b.min && (b.max === null || taxable <= b.max));
    if (!bracket) throw new Error(`No tax bracket for taxable ${taxable}`);
    const { num: rNum, den: rDen } = parseRate(bracket.rate);
    const annualTax = Math.max(0, roundHalfUp(taxable * rNum - bracket.progressiveDiff * rDen, rDen));
    return { withholding: roundHalfUp(annualTax, 12), rate: bracket.rate, taxableAnnual: taxable };
  }

  if (input.type === 'residentBonus') {
    assertNonNeg('amount', input.amount);
    const { rate, threshold } = it.nonMonthly;
    return { withholding: input.amount >= threshold ? applyRate(Math.floor(input.amount), [rate], 'round') : 0, rate };
  }

  // nonResident
  assertNonNeg('monthlySalary', input.monthlySalary);
  const threshold = it.nonResident.reducedThresholdMultiplier * data.minimumWage.monthly;
  const rate = input.monthlySalary <= threshold ? it.nonResident.reducedRate : it.nonResident.rate;
  return { withholding: applyRate(Math.floor(input.monthlySalary), [rate], 'round'), rate };
}
