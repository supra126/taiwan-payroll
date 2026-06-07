import type { YearData, Rounding, EmployerSupplementaryInput, EmployerSupplementaryResult } from '../types';
import { applyRate } from '../rounding/strategies';

/**
 * 投保單位（雇主）二代健保補充保費。
 * base = max(0, 每月支付薪資總額 − 受僱者當月健保投保金額總額)；premium = round(base × rate)。
 * 無上限（個人端 singlePaymentCap 不適用），無門檻。費率讀 data.supplementaryPremium.rate。
 * Source: 健保署「補充保險費計算公式」cp-4516。
 */
export function calcEmployerSupplementary(
  data: YearData,
  input: EmployerSupplementaryInput,
  rounding: Rounding,
): EmployerSupplementaryResult {
  const { monthlyPaidTotal, monthlyInsuredTotal } = input;
  if (!Number.isFinite(monthlyPaidTotal) || monthlyPaidTotal < 0) {
    throw new Error(`monthlyPaidTotal must be a finite non-negative number, got ${monthlyPaidTotal}`);
  }
  if (!Number.isFinite(monthlyInsuredTotal) || monthlyInsuredTotal < 0) {
    throw new Error(`monthlyInsuredTotal must be a finite non-negative number, got ${monthlyInsuredTotal}`);
  }
  const rate = data.supplementaryPremium.rate;
  const base = Math.max(0, monthlyPaidTotal - monthlyInsuredTotal);
  return { base, rate, premium: applyRate(base, [rate], rounding) };
}
