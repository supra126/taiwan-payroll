import type { Rounding } from '../types';

export interface Fraction {
  num: number;
  den: number;
}

/** Round-half-up of the exact rational num/den. Requires den > 0, num >= 0. Integer-exact. */
export function roundHalfUp(num: number, den: number): number {
  return Math.floor((num * 2 + den) / (den * 2));
}

/** Ceil of num/den. Requires den > 0, num >= 0. Integer-exact (no float division). */
export function ceilDiv(num: number, den: number): number {
  return Math.floor((num + den - 1) / den);
}

/** Parse a non-negative decimal string ("0.0517") into an exact fraction {num, den}. */
export function parseRate(s: string): Fraction {
  // Reject anything that is not a plain non-negative decimal — notably scientific
  // notation ("1e-8"), which would otherwise be silently misread by parseInt.
  if (!/^\d+(\.\d+)?$/.test(s)) {
    throw new Error(`Invalid rate string "${s}" (expected non-negative decimal like "0.0517")`);
  }
  const [int, frac = ''] = s.split('.');
  const den = 10 ** frac.length;
  const num = parseInt(int + frac, 10);
  return { num, den };
}

/** Convert a non-negative number rate to a decimal string parseRate accepts (no scientific notation). */
export function numberToRateString(n: number): string {
  return n.toFixed(10);
}

/** Multiply an integer base by a list of rate strings, returning the exact product as a fraction. */
export function mulRates(base: number, rates: string[]): Fraction {
  let num = base;
  let den = 1;
  for (const r of rates) {
    const f = parseRate(r);
    num *= f.num;
    den *= f.den;
  }
  return { num, den };
}

/** Multiply base by rates and round to an integer with the given strategy (default round-half-up). */
export function applyRate(base: number, rates: string[], strategy: Rounding = 'round'): number {
  const { num, den } = mulRates(base, rates);
  return strategy === 'ceil' ? ceilDiv(num, den) : roundHalfUp(num, den);
}

/** Multiply base by rates and by days/basis, rounding once. Integer-exact. */
export function applyRateProrated(
  base: number,
  rates: string[],
  days: number,
  basis = 30,
  strategy: Rounding = 'round',
): number {
  const { num, den } = mulRates(base, rates);
  const n = num * days;
  const d = den * basis;
  return strategy === 'ceil' ? ceilDiv(n, d) : roundHalfUp(n, d);
}
