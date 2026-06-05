import { describe, it, expect } from 'vitest';
import { createPayrollEngine } from 'taiwan-payroll';
import { formatNTD, formatRate } from './format';
import {
  runCalculate,
  runSupplementary,
  runProrated,
  toRows,
  type PayrollForm,
  type SupplementaryForm,
  type ProratedForm,
} from './calc';

describe('format', () => {
  it('formatNTD groups thousands deterministically', () => {
    expect(formatNTD(0)).toBe('0');
    expect(formatNTD(1050)).toBe('1,050');
    expect(formatNTD(211000)).toBe('211,000');
  });
  it('formatRate renders a decimal rate string as a percent', () => {
    expect(formatRate('0.06')).toBe('6%');
    expect(formatRate('0')).toBe('0%');
    expect(formatRate('0.0211')).toBe('2.11%');
  });
});

const basePayroll: PayrollForm = {
  year: 2026,
  monthlySalary: '42000',
  identity: 'category1',
  partTime: false,
  dependents: '1',
  employmentInsurance: true,
  pensionSelfContribution: '0.06',
  rounding: 'round',
};

describe('runCalculate', () => {
  it('maps the form to a core call and returns the same result', () => {
    const out = runCalculate(basePayroll);
    const direct = createPayrollEngine({ year: 2026 }).calculate({
      monthlySalary: 42000,
      identity: 'category1',
      partTime: false,
      dependents: 1,
      employmentInsurance: true,
      pensionSelfContribution: 0.06,
      occupationalRate: undefined,
      rounding: 'round',
    });
    expect(out).toEqual({ ok: true, result: direct });
  });
  it('returns a friendly error for invalid input', () => {
    const out = runCalculate({ ...basePayroll, monthlySalary: '-1' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/monthlySalary/);
  });
  it('handles part-time low brackets', () => {
    const out = runCalculate({ ...basePayroll, monthlySalary: '15000', partTime: true });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.result.brackets.labor).toBe(15840);
  });
  it('家事移工: no 勞保, 職災 uses 0.18%', () => {
    const out = runCalculate({ ...basePayroll, monthlySalary: '30000', identity: 'migrantDomestic' });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.result.brackets.labor).toBe(0);
      expect(out.result.employer.occupational).toBe(55); // 30300 x 0.18%
    }
  });
});

describe('toRows', () => {
  it('produces one labelled row per scheme plus a total row', () => {
    const r = createPayrollEngine({ year: 2026 }).calculate({ monthlySalary: 42000 });
    const rows = toRows(r);
    expect(rows.map((x) => x.label)).toEqual(['勞保（含就保）', '健保', '勞退', '職災', '合計']);
    expect(rows[0]).toEqual({ label: '勞保（含就保）', employee: r.employee.labor, employer: r.employer.labor, government: r.government.labor });
    expect(rows[4]).toEqual({ label: '合計', employee: r.employee.total, employer: r.employer.total });
  });
});

describe('runSupplementary', () => {
  const base: SupplementaryForm = { year: 2026, type: 'bonus', amount: '200000', monthlyInsuredSalary: '42000', ytdBonus: '', rounding: 'round' };
  it('computes a bonus premium', () => {
    expect(runSupplementary(base)).toEqual({ ok: true, result: { type: 'bonus', chargeable: 32000, rate: '0.0211', premium: 675 } });
  });
  it('errors when bonus lacks monthlyInsuredSalary', () => {
    const out = runSupplementary({ ...base, monthlyInsuredSalary: '' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/monthlyInsuredSalary/);
  });
  it('charges a dividend in full', () => {
    expect(runSupplementary({ year: 2026, type: 'dividend', amount: '50000', monthlyInsuredSalary: '', ytdBonus: '', rounding: 'round' })).toEqual({
      ok: true,
      result: { type: 'dividend', chargeable: 50000, rate: '0.0211', premium: 1055 },
    });
  });
});

describe('runProrated', () => {
  const base: ProratedForm = { year: 2026, monthlySalary: '29500', identity: 'category1', partTime: false, dependents: '', employmentInsurance: true, pensionSelfContribution: '', rounding: 'round', startDate: '2026-03-08', endDate: '' };
  it('computes a mid-month join', () => {
    const out = runProrated(base);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.result.days.insured).toBe(23);
      expect(out.result.healthCharged).toBe(true);
    }
  });
  it('errors when neither date is given', () => {
    const out = runProrated({ ...base, startDate: '', endDate: '' });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.error).toMatch(/startDate or endDate/);
  });
});
