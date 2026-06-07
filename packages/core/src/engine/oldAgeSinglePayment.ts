import type { YearData, OldAgeSinglePaymentInput, OldAgeSinglePaymentResult } from '../types';
import { roundHalfUp } from '../rounding/strategies';

function assertNonNegInt(name: string, v: number): void {
  if (!Number.isInteger(v) || v < 0) {
    throw new Error(`${name} must be a non-negative integer, got ${v}`);
  }
}

export function calcOldAgeSinglePayment(
  data: YearData,
  input: OldAgeSinglePaymentInput,
): OldAgeSinglePaymentResult {
  const spb = data.oldAgePension?.singlePaymentBasis;
  if (!spb) {
    throw new Error(
      `No oldAgePension.singlePaymentBasis for year ${data.year}（該年度無一次請領老年給付資料）`,
    );
  }
  const preM = input.preSixtyMonths ?? 0;
  const postY = input.postSixtyYears ?? 0;
  const postM = input.postSixtyMonths ?? 0;
  if (!Number.isFinite(input.avgInsuredSalary) || input.avgInsuredSalary < 0) {
    throw new Error(
      `avgInsuredSalary must be a finite non-negative number, got ${input.avgInsuredSalary}`,
    );
  }
  assertNonNegInt('preSixtyYears', input.preSixtyYears);
  assertNonNegInt('preSixtyMonths', preM);
  assertNonNegInt('postSixtyYears', postY);
  assertNonNegInt('postSixtyMonths', postM);
  if (preM > 11 || postM > 11) throw new Error('months must be 0–11');

  const P = input.preSixtyYears * 12 + preM;
  const Q = postY * 12 + postM;
  const T = spb.firstTierYears * 12;
  const pre60 = Math.min(
    Math.min(P, T) * spb.firstTierBasisPerYear + Math.max(0, P - T) * spb.secondTierBasisPerYear,
    spb.preSixtyMaxBasis * 12,
  );
  const post60 = spb.secondTierBasisPerYear * Math.min(Q, spb.postSixtyCapYears * 12);
  const basisTwelfths = Math.min(pre60 + post60, spb.combinedMaxBasis * 12);
  return { payment: roundHalfUp(input.avgInsuredSalary * basisTwelfths, 12), basisTwelfths };
}
