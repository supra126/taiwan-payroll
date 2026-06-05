import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

let failed = false;

// ---- 1. Validate data/{year}.json against data/schema.json + bracket continuity ----
const dataSchema = JSON.parse(readFileSync(join(root, 'data/schema.json'), 'utf8'));
const validateData = ajv.compile(dataSchema);

interface RawBracket { grade: number; min: number; max: number | null; insuredSalary: number }

for (const file of readdirSync(join(root, 'data')).filter((f) => /^\d{4}\.json$/.test(f))) {
  let fileFailed = false;
  const data = JSON.parse(readFileSync(join(root, 'data', file), 'utf8'));
  if (!validateData(data)) {
    failed = true;
    console.error(`✗ data/${file} schema errors:`, validateData.errors);
    continue;
  }
  for (const scheme of ['laborInsurance', 'occupationalInsurance', 'healthInsurance', 'pension'] as const) {
    const brackets = (data as Record<string, { brackets: RawBracket[] }>)[scheme].brackets;
    let prev = 0;
    brackets.forEach((b, i) => {
      const expectMin = i === 0 ? 0 : prev + 1;
      if (b.grade !== i + 1) { fileFailed = true; console.error(`✗ data/${file} ${scheme} grade ${b.grade} not sequential`); }
      if (b.min !== expectMin) { fileFailed = true; console.error(`✗ data/${file} ${scheme} grade ${b.grade} min ${b.min} expected ${expectMin}`); }
      if (i < brackets.length - 1 && b.max !== b.insuredSalary) { fileFailed = true; console.error(`✗ data/${file} ${scheme} grade ${b.grade} max should equal insuredSalary`); }
      if (i === brackets.length - 1 && b.max !== null) { fileFailed = true; console.error(`✗ data/${file} ${scheme} top grade max must be null`); }
      if (b.insuredSalary <= prev) { fileFailed = true; console.error(`✗ data/${file} ${scheme} grade ${b.grade} insuredSalary not increasing`); }
      prev = b.insuredSalary;
    });
  }
  // Part-time low brackets (勞保/健保 only): continuous, and below the regular grade-1 insured.
  for (const scheme of ['laborInsurance', 'healthInsurance'] as const) {
    const sc = (data as Record<string, { brackets: RawBracket[]; partTimeBrackets?: RawBracket[] }>)[scheme];
    const pt = sc.partTimeBrackets;
    if (!pt) continue;
    let prev = 0;
    pt.forEach((b, i) => {
      const expectMin = i === 0 ? 0 : prev + 1;
      if (b.grade !== i + 1) { fileFailed = true; console.error(`✗ data/${file} ${scheme} partTime grade ${b.grade} not sequential`); }
      if (b.min !== expectMin) { fileFailed = true; console.error(`✗ data/${file} ${scheme} partTime grade ${b.grade} min ${b.min} expected ${expectMin}`); }
      if (b.max !== b.insuredSalary) { fileFailed = true; console.error(`✗ data/${file} ${scheme} partTime grade ${b.grade} max must equal insuredSalary`); }
      if (b.insuredSalary <= prev) { fileFailed = true; console.error(`✗ data/${file} ${scheme} partTime grade ${b.grade} insuredSalary not increasing`); }
      prev = b.insuredSalary;
    });
    if (pt[pt.length - 1].insuredSalary >= sc.brackets[0].insuredSalary) {
      fileFailed = true;
      console.error(`✗ data/${file} ${scheme} top partTime insured must be < regular grade-1 insured`);
    }
  }
  failed = failed || fileFailed;
  if (!fileFailed) console.log(`✓ data/${file} valid`);
}

// ---- 2. Validate testdata/**/*.json against testdata/schema.json ----
const vectorSchema = JSON.parse(readFileSync(join(root, 'testdata/schema.json'), 'utf8'));
const validateVector = ajv.compile(vectorSchema);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (n === 'schema.json') return [];
    const f = join(dir, n);
    return statSync(f).isDirectory() ? walk(f) : f.endsWith('.json') ? [f] : [];
  });
}

let vectorCount = 0;
for (const f of walk(join(root, 'testdata'))) {
  const vec = JSON.parse(readFileSync(f, 'utf8'));
  vectorCount++;
  if (!validateVector(vec)) {
    failed = true;
    console.error(`✗ ${f.replace(root + '/', '')} vector schema errors:`, validateVector.errors);
  }
}
if (!failed) console.log(`✓ ${vectorCount} testdata vectors valid`);

process.exit(failed ? 1 : 0);
