import { describe, it, expect } from 'vitest';
import { createPayrollEngine, getYearData, getAvailableYears } from 'taiwan-payroll';
import { calculatePayrollTool, supplementaryTool, employerSupplementaryTool, proratedTool, listYearsTool, allTools } from '../src/tools';

const latest = Math.max(...getAvailableYears()); // the year the tools default to

/** Narrow the first content block to its text (CallToolResult.content is a union). */
function textOf(r: ReturnType<typeof calculatePayrollTool.handler>): string {
  const c = r.content[0];
  return c.type === 'text' ? c.text : '';
}

describe('calculate_payroll tool', () => {
  it('returns the same numbers as a direct core call, with a summary line', () => {
    const r = calculatePayrollTool.handler({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
    expect(r.isError).toBeUndefined();
    const direct = createPayrollEngine({ year: latest }).calculate({ monthlySalary: 42000, dependents: 1, pensionSelfContribution: 0.06 });
    expect(textOf(r)).toContain(JSON.stringify(direct, null, 2));
    // summary line carries the actual totals, not just the label
    expect(textOf(r)).toContain(`員工自付合計 ${direct.employee.total} 元、雇主負擔 ${direct.employer.total} 元`);
  });
  it('defaults to the latest year', () => {
    expect(textOf(calculatePayrollTool.handler({ monthlySalary: 42000 }))).toContain(`"year": ${latest}`);
  });
  it('uses the requested year', () => {
    expect(textOf(calculatePayrollTool.handler({ year: 2025, monthlySalary: 28590 }))).toContain('"year": 2025');
  });
  it('passes core errors through as isError', () => {
    const r = calculatePayrollTool.handler({ monthlySalary: -1 });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toMatch(/monthlySalary/);
  });
  it('exposes M4 features: migrant identity', () => {
    const r = calculatePayrollTool.handler({ monthlySalary: 30000, identity: 'migrantDomestic', occupationalRate: 0.0018 });
    expect(r.isError).toBeUndefined();
    expect(textOf(r)).toContain('"labor": 0'); // 家事移工無勞保
    expect(textOf(r)).toContain('"occupational": 55');
  });
  it('exposes M4 features: part-time low bracket', () => {
    expect(textOf(calculatePayrollTool.handler({ monthlySalary: 15000, partTime: true }))).toContain('"labor": 15840');
  });
});

describe('calculate_supplementary_premium tool', () => {
  it('computes the bonus premium (200000 over 4x 42000)', () => {
    const r = supplementaryTool.handler({ type: 'bonus', amount: 200000, monthlyInsuredSalary: 42000 });
    expect(textOf(r)).toContain('"premium": 675');
    expect(textOf(r)).toContain('"chargeable": 32000');
  });
  it('errors when bonus is missing monthlyInsuredSalary', () => {
    const r = supplementaryTool.handler({ type: 'bonus', amount: 200000 });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toMatch(/monthlyInsuredSalary/);
  });
});

describe('calculate_employer_supplementary_premium tool', () => {
  it('回傳與 core 一致的數字與摘要', () => {
    const r = employerSupplementaryTool.handler({ monthlyPaidTotal: 5_000_000, monthlyInsuredTotal: 4_200_000 });
    expect(r.isError).toBeUndefined();
    const direct = createPayrollEngine({ year: latest }).calculateEmployerSupplementary({ monthlyPaidTotal: 5_000_000, monthlyInsuredTotal: 4_200_000 });
    const text = r.content[0].type === 'text' ? r.content[0].text : '';
    expect(text).toContain(JSON.stringify(direct, null, 2));
    expect(text).toContain(`${direct.premium} 元`);
  });
  it('被收進 allTools', () => {
    expect(allTools.some((t) => t.name === 'calculate_employer_supplementary_premium')).toBe(true);
  });
});

describe('calculate_prorated tool', () => {
  it('reports insured days and healthCharged for a mid-month join', () => {
    const r = proratedTool.handler({ monthlySalary: 29500, startDate: '2026-03-08' });
    expect(textOf(r)).toContain('"insured": 23');
    expect(textOf(r)).toContain('"healthCharged": true');
  });
  it('errors when neither date is given', () => {
    const r = proratedTool.handler({ monthlySalary: 29500 });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toMatch(/startDate or endDate/);
  });
});

describe('allTools registry', () => {
  it('exposes the five tools with unique names and a handler each', () => {
    expect(allTools.map((t) => t.name)).toEqual([
      'calculate_payroll',
      'calculate_supplementary_premium',
      'calculate_employer_supplementary_premium',
      'calculate_prorated',
      'list_years',
    ]);
    expect(new Set(allTools.map((t) => t.name)).size).toBe(5);
    for (const t of allTools) expect(typeof t.handler).toBe('function');
  });
});

describe('list_years tool', () => {
  it('lists every available year with dataVersion and minimumWage object', () => {
    const r = listYearsTool.handler({});
    expect(r.isError).toBeUndefined();
    const d2026 = getYearData(2026);
    expect(textOf(r)).toContain('"year": 2026');
    expect(textOf(r)).toContain(`"dataVersion": "${d2026.dataVersion}"`);
    expect(textOf(r)).toContain('"monthly": 29500');
    expect(textOf(r)).toContain('"year": 2025');
  });
});
