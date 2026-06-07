import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPayrollEngine } from '../src/index';

const testdataRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../testdata');

function collect(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'schema.json') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...collect(full));
    else if (name.endsWith('.json')) out.push(full);
  }
  return out;
}

// Assert every leaf present in `expected` equals the same path in `actual` (partial assertion).
function assertSubset(actual: unknown, expected: Record<string, unknown>, path: string): void {
  for (const key of Object.keys(expected)) {
    const e = expected[key];
    const a = (actual as Record<string, unknown>)?.[key];
    const p = path ? `${path}.${key}` : key;
    if (e !== null && typeof e === 'object') assertSubset(a, e as Record<string, unknown>, p);
    else expect(a, `vector field ${p}`).toBe(e);
  }
}

const files = collect(testdataRoot);

describe('golden test vectors', () => {
  it('found at least 10 vectors', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
  });

  for (const file of files) {
    const v = JSON.parse(readFileSync(file, 'utf8'));
    const kind = v.kind ?? 'calculate';
    it(`${v.id}: ${v.description}`, () => {
      const engine = createPayrollEngine({ year: v.year });
      const result =
        kind === 'withholding'
          ? engine.calculateWithholding(v.input)
          : kind === 'employer-supplementary'
            ? engine.calculateEmployerSupplementary(v.input)
            : kind === 'supplementary'
              ? engine.calculateSupplementary(v.input)
              : kind === 'prorated'
                ? engine.calculateProrated(v.input)
                : kind === 'old-age-pension'
                  ? engine.calculateOldAgePension(v.input)
                  : engine.calculate(v.input);
      assertSubset(result, v.expected, '');
    });
  }
});
