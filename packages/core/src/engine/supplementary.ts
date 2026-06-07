import type { YearData, Rounding, SupplementaryInput, SupplementaryResult } from '../types';
import { applyRate } from '../rounding/strategies';

/**
 * 二代健保補充保費 (2.11%). premium = round(chargeable × rate).
 *  - bonus: threshold = bonusThresholdMultiplier × this payment's current-month insured;
 *           chargeable = the part of THIS payment above the running cumulative threshold (uses ytdBonus).
 *  - parttime: threshold = minimum wage; others: threshold = lowerThreshold (20,000).
 *           non-bonus charges the FULL amount (capped at singlePaymentCap) when amount >= threshold.
 * Source: 健保署「補充保險費計算公式」cp-4516.
 */
export function calcSupplementary(
  data: YearData,
  input: SupplementaryInput,
  rounding: Rounding,
): SupplementaryResult {
  const sp = data.supplementaryPremium;
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error(`amount must be a finite non-negative number, got ${input.amount}`);
  }

  let chargeable: number;
  if (input.type === 'bonus') {
    if (
      input.monthlyInsuredSalary === undefined ||
      !Number.isFinite(input.monthlyInsuredSalary) ||
      input.monthlyInsuredSalary <= 0
    ) {
      throw new Error(`bonus requires a positive monthlyInsuredSalary, got ${input.monthlyInsuredSalary}`);
    }
    const ytd = input.ytdBonus ?? 0;
    if (!Number.isFinite(ytd) || ytd < 0) {
      throw new Error(`ytdBonus must be a finite non-negative number, got ${ytd}`);
    }
    const threshold = sp.bonusThresholdMultiplier * input.monthlyInsuredSalary;
    chargeable = Math.max(0, ytd + input.amount - Math.max(ytd, threshold));
  } else {
    const threshold = input.type === 'parttime' ? data.minimumWage.monthly : sp.lowerThreshold;
    chargeable = input.amount >= threshold ? Math.min(input.amount, sp.singlePaymentCap) : 0;
  }

  return { type: input.type, chargeable, rate: sp.rate, premium: applyRate(chargeable, [sp.rate], rounding) };
}

/**
 * 便利函式：算「一般股東/雇主」常見情況的股利扣繳補充保險費。
 *  - 一般股東 (employerInsuredTotal = 0)：min(amount, singlePaymentCap) × rate
 *  - 雇主：(min(amount, singlePaymentCap) − 投保額總額) × rate
 * 單次給付未達 lowerThreshold (2 萬) 不扣。
 * 不涵蓋股票股利/特殊註記等情形——那些由呼叫端自行判定後以 record.premium 提供。
 */
export function calcDividendPremium(data: YearData, amount: number, employerInsuredTotal = 0): number {
  const sp = data.supplementaryPremium;
  if (amount < sp.lowerThreshold) return 0;
  const base = Math.max(0, Math.min(amount, sp.singlePaymentCap) - employerInsuredTotal);
  return applyRate(base, [sp.rate], 'round');
}
