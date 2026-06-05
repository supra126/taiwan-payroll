import type { Bracket } from '../types';

/**
 * Find the bracket to report for a given monthly salary.
 * Rule: the first bracket whose `max >= salary` (top bracket max=null is +infinity).
 * A salary below the lowest bracket maps to grade 1. (規則：薪資介於兩級之間取較高級)
 */
export function findBracket(brackets: Bracket[], salary: number): Bracket {
  for (const b of brackets) {
    if (b.max === null || salary <= b.max) return b;
  }
  return brackets[brackets.length - 1];
}

/** Brackets to search: prepend the part-time low brackets when part-time and present (勞保/健保). */
export function bracketsFor(regular: Bracket[], partTimeBrackets: Bracket[] | undefined, partTime: boolean): Bracket[] {
  return partTime && partTimeBrackets ? [...partTimeBrackets, ...regular] : regular;
}
