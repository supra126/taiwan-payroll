import { describe, it, expect } from 'vitest';
import {
  roundHalfUp,
  ceilDiv,
  parseRate,
  applyRate,
  numberToRateString,
  applyRateProrated,
} from '../src/rounding/strategies';
import { findBracket } from '../src/lookup/bracket';
import { calcLaborInsurance } from '../src/engine/laborInsurance';
import { calcHealthInsurance } from '../src/engine/healthInsurance';
import { calcPension } from '../src/engine/pension';
import { calcOccupational } from '../src/engine/occupational';
import { calcSupplementary } from '../src/engine/supplementary';
import { calcEmployerSupplementary } from '../src/engine/employerSupplementary';
import { calcWithholding } from '../src/engine/withholding';
import { computeInsuredDays, healthChargedThisMonth } from '../src/engine/prorated';
import { createPayrollEngine, getAvailableYears, getYearData } from '../src/index';
import data2026 from '../../../data/2026.json';
import type { Bracket, YearData } from '../src/types';

const D = data2026 as unknown as YearData;

describe('roundHalfUp (exact integer math)', () => {
  it('rounds .5 up', () => {
    expect(roundHalfUp(7375, 10)).toBe(738); // 737.5
    expect(roundHalfUp(6785, 10)).toBe(679); // 678.5
  });
  it('rounds below .5 down', () => {
    expect(roundHalfUp(4576, 10)).toBe(458); // 457.6
  });
  it('exact integers pass through', () => {
    expect(roundHalfUp(1050, 1)).toBe(1050);
  });
});

describe('ceilDiv', () => {
  it('ceils', () => {
    expect(ceilDiv(7371, 10)).toBe(738); // 737.1 -> 738
    expect(ceilDiv(7380, 10)).toBe(738);
  });
});

describe('parseRate / applyRate', () => {
  it('parses decimal strings to exact fractions', () => {
    expect(parseRate('0.0517')).toEqual({ num: 517, den: 10000 });
    expect(parseRate('0.125')).toEqual({ num: 125, den: 1000 });
  });
  it('applyRate computes insured x rates with one final round', () => {
    expect(applyRate(29500, ['0.125', '0.2'])).toBe(738); // 737.5
    expect(applyRate(29500, ['0.0517', '0.3'])).toBe(458); // 457.605
    expect(applyRate(42000, ['0.0517', '0.6', '1.56'])).toBe(2032);
  });
  it('applyRate supports the ceil strategy (integer-exact)', () => {
    expect(applyRate(29500, ['0.125', '0.2'], 'ceil')).toBe(738); // 737.5 -> 738
    expect(applyRate(29501, ['0.125', '0.2'], 'ceil')).toBe(738); // 737.525 -> 738
    expect(applyRate(30000, ['0.125', '0.2'], 'ceil')).toBe(750); // 750 exact -> 750
    expect(applyRate(30008, ['0.125', '0.2'], 'ceil')).toBe(751); // 750.2 -> 751
  });
  it('parseRate rejects scientific notation and other non-decimal strings', () => {
    expect(() => parseRate('1e-8')).toThrow(/Invalid rate/);
    expect(() => parseRate('abc')).toThrow(/Invalid rate/);
    expect(() => parseRate('-0.1')).toThrow(/Invalid rate/);
  });
  it('numberToRateString converts to a parseRate-safe decimal string', () => {
    expect(numberToRateString(0.0021)).toBe('0.0021000000');
    expect(numberToRateString(1e-8)).toBe('0.0000000100');
    expect(numberToRateString(0)).toBe('0.0000000000');
    expect(applyRate(29500, [numberToRateString(0.0021)])).toBe(62); // 61.95 -> 62
  });
});

describe('applyRateProrated (integer-exact × days/30)', () => {
  it('prorates pension by days', () => {
    expect(applyRateProrated(36300, ['0.06'], 6)).toBe(436); // 435.6 -> 436
    expect(applyRateProrated(48200, ['0.06'], 27)).toBe(2603); // 2602.8 -> 2603
  });
  it('prorates a multi-rate labor share', () => {
    expect(applyRateProrated(29500, ['0.125', '0.2'], 23)).toBe(565); // 737.5 x 23/30 -> 565
  });
  it('30 days equals the full-month amount', () => {
    expect(applyRateProrated(29500, ['0.125', '0.2'], 30)).toBe(738);
  });
});

describe('calcOccupational (employer-only)', () => {
  it('uses the default rate from data', () => {
    const r = calcOccupational(D, 29500, '0.0021', 'round');
    expect(r.insured).toBe(29500);
    expect(r.employer).toBe(62); // 29500 x 0.21% = 61.95 -> 62
  });
  it('caps at the occupational top grade 72800', () => {
    expect(calcOccupational(D, 200000, '0.0021', 'round').insured).toBe(72800);
    expect(calcOccupational(D, 200000, '0.0021', 'round').employer).toBe(153); // 72800 x 0.21% = 152.88 -> 153
  });
});

describe('calcSupplementary (6 categories)', () => {
  it('bonus charges only the excess over 4x current-month insured', () => {
    const r = calcSupplementary(D, { type: 'bonus', amount: 200000, monthlyInsuredSalary: 42000 }, 'round');
    expect(r.chargeable).toBe(32000);
    expect(r.premium).toBe(675); // 32000 x 2.11% = 675.2 -> 675
  });
  it('bonus accumulates with ytdBonus already above threshold', () => {
    const r = calcSupplementary(D, { type: 'bonus', amount: 50000, monthlyInsuredSalary: 42000, ytdBonus: 200000 }, 'round');
    expect(r.chargeable).toBe(50000);
    expect(r.premium).toBe(1055);
  });
  it('bonus below threshold is not charged', () => {
    expect(calcSupplementary(D, { type: 'bonus', amount: 100000, monthlyInsuredSalary: 42000 }, 'round').chargeable).toBe(0);
  });
  it('dividend charges the full amount when >= 20000, else 0', () => {
    expect(calcSupplementary(D, { type: 'dividend', amount: 50000 }, 'round').premium).toBe(1055);
    expect(calcSupplementary(D, { type: 'dividend', amount: 19999 }, 'round').chargeable).toBe(0);
  });
  it('parttime threshold is the minimum wage (29500 in 2026)', () => {
    expect(calcSupplementary(D, { type: 'parttime', amount: 29500 }, 'round').chargeable).toBe(29500);
    expect(calcSupplementary(D, { type: 'parttime', amount: 29000 }, 'round').chargeable).toBe(0);
  });
  it('caps a single payment at 10,000,000', () => {
    const r = calcSupplementary(D, { type: 'dividend', amount: 12000000 }, 'round');
    expect(r.chargeable).toBe(10000000);
    expect(r.premium).toBe(211000);
  });
  it('throws when bonus is missing monthlyInsuredSalary, or amount is invalid', () => {
    expect(() => calcSupplementary(D, { type: 'bonus', amount: 100000 }, 'round')).toThrow(/monthlyInsuredSalary/);
    expect(() => calcSupplementary(D, { type: 'dividend', amount: NaN }, 'round')).toThrow(/amount/);
    expect(() => calcSupplementary(D, { type: 'dividend', amount: -1 }, 'round')).toThrow(/amount/);
  });
  it('throws for non-finite/negative ytdBonus instead of returning NaN', () => {
    expect(() => calcSupplementary(D, { type: 'bonus', amount: 100000, monthlyInsuredSalary: 42000, ytdBonus: NaN }, 'round')).toThrow(/ytdBonus/);
    expect(() => calcSupplementary(D, { type: 'bonus', amount: 100000, monthlyInsuredSalary: 42000, ytdBonus: Infinity }, 'round')).toThrow(/ytdBonus/);
    expect(() => calcSupplementary(D, { type: 'bonus', amount: 100000, monthlyInsuredSalary: 42000, ytdBonus: -1 }, 'round')).toThrow(/ytdBonus/);
  });
});

describe('calcLaborInsurance aggregate-then-round', () => {
  it('government absorbs the rounding remainder so the parts sum to round(insured x rate)', () => {
    const round = calcLaborInsurance(D, 31800, true, 'round');
    expect([round.employee, round.employer, round.government]).toEqual([795, 2783, 398]);
    const agg = calcLaborInsurance(D, 31800, true, 'aggregate-then-round');
    expect([agg.employee, agg.employer, agg.government]).toEqual([795, 2783, 397]);
    expect(agg.employee + agg.employer + agg.government).toBe(3975);
  });
});

describe('prorated day count', () => {
  it('join-only: 30 - startDay + 1', () => {
    expect(computeInsuredDays('2026-03-08', undefined)).toBe(23);
  });
  it('leave-only: endDay', () => {
    expect(computeInsuredDays(undefined, '2026-03-08')).toBe(8);
  });
  it('same-month join and leave: end - start + 1', () => {
    expect(computeInsuredDays('2026-02-03', '2026-02-18')).toBe(16);
  });
  it('normalizes day 31 to 30', () => {
    expect(computeInsuredDays('2026-01-31', undefined)).toBe(1);
    expect(computeInsuredDays(undefined, '2026-01-31')).toBe(30);
  });
  it('throws when neither date is given, or dates span different months', () => {
    expect(() => computeInsuredDays(undefined, undefined)).toThrow(/startDate or endDate/);
    expect(() => computeInsuredDays('2026-01-10', '2026-02-10')).toThrow(/same month/);
  });
  it('throws on a malformed (non-YYYY-MM-DD) date instead of returning NaN', () => {
    expect(() => computeInsuredDays('2026-3-8', undefined)).toThrow(/YYYY-MM-DD/);
    expect(() => computeInsuredDays(undefined, '')).toThrow();
  });
});

describe('health 月底歸屬', () => {
  it('charges full month for join-only, nothing when leaving this month', () => {
    expect(healthChargedThisMonth('2026-03-08', undefined)).toBe(true);
    expect(healthChargedThisMonth(undefined, '2026-03-08')).toBe(false);
    expect(healthChargedThisMonth('2026-02-03', '2026-02-18')).toBe(false);
  });
});

describe('engine.calculateProrated', () => {
  const engine = createPayrollEngine({ year: 2026 });
  it('join mid-month: labor/pension by day, health full month', () => {
    const r = engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08' });
    expect(r.days.insured).toBe(23);
    expect(r.healthCharged).toBe(true);
    expect(r.employee.labor).toBe(565);
    expect(r.employer.pension).toBe(1357); // 1770 x 23/30
    expect(r.employee.health).toBe(458);
  });
  it('leave mid-month: health is zero (月底歸屬)', () => {
    const r = engine.calculateProrated({ monthlySalary: 29500, endDate: '2026-03-08' });
    expect(r.days.insured).toBe(8);
    expect(r.healthCharged).toBe(false);
    expect(r.employee.health).toBe(0);
    expect(r.employer.health).toBe(0);
    expect(r.employee.labor).toBe(197);
  });
  it('matches the official 勞退 prorated anchors', () => {
    expect(engine.calculateProrated({ monthlySalary: 36300, startDate: '2026-02-25' }).employer.pension).toBe(436);
    expect(engine.calculateProrated({ monthlySalary: 48200, startDate: '2026-07-04' }).employer.pension).toBe(2603);
  });
  it('throws when neither date is given', () => {
    expect(() => engine.calculateProrated({ monthlySalary: 29500 })).toThrow(/startDate or endDate/);
  });
  it('prorates the voluntary pension self-contribution too', () => {
    const r = engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08', pensionSelfContribution: 0.06 });
    expect(r.employee.pensionSelf).toBe(1357); // 1770 x 23/30, same as employer at 6%
  });
  it('validates monthlySalary, identity, occupationalRate, dependents, and pensionSelfContribution', () => {
    expect(() => engine.calculateProrated({ monthlySalary: -1, startDate: '2026-03-08' })).toThrow(/monthlySalary/);
    expect(() => engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08', identity: 'category2' as never })).toThrow(/identity/i);
    expect(() => engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08', occupationalRate: 0.89 })).toThrow(/occupationalRate/);
    expect(() => engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08', dependents: NaN })).toThrow(/dependents/);
    expect(() => engine.calculateProrated({ monthlySalary: 29500, startDate: '2026-03-08', pensionSelfContribution: NaN })).toThrow(/pensionSelfContribution/);
  });
  it('aggregate-then-round keeps the prorated labor parts summing to the prorated total', () => {
    const r = engine.calculateProrated({ monthlySalary: 31800, startDate: '2026-03-08', rounding: 'aggregate-then-round' });
    const total = applyRateProrated(31800, ['0.125'], 23, 30, 'round');
    expect(r.employee.labor + r.employer.labor + r.government.labor).toBe(total);
  });
});

describe('part-time brackets (勞保/健保 only; 職保 floors to 29,500)', () => {
  const engine = createPayrollEngine({ year: 2026 });
  it('maps a sub-minimum-wage part-timer to the low labor/health bracket; occupational stays 29,500', () => {
    const pt = engine.calculate({ monthlySalary: 15000, partTime: true });
    expect(pt.brackets.labor).toBe(15840);
    expect(pt.brackets.health).toBe(15840);
    expect(pt.brackets.occupational).toBe(29500); // 職保 has no part-time low brackets (官方 FAQ)
    expect(pt.employee.labor).toBe(396); // 15840 x 12.5% x 20%
  });
  it('floors a part-timer below the lowest level to 11,100 (labor/health)', () => {
    expect(engine.calculate({ monthlySalary: 5000, partTime: true }).brackets.labor).toBe(11100);
  });
  it('uses the full-time grade 1 above 28,590 even when part-time', () => {
    expect(engine.calculate({ monthlySalary: 29000, partTime: true }).brackets.labor).toBe(29500);
  });
  it('uses the regular table above minimum wage', () => {
    expect(engine.calculate({ monthlySalary: 35000, partTime: true }).brackets.labor).toBe(36300);
  });
  it('without partTime, the same low salary still floors to grade 1 (regression)', () => {
    expect(engine.calculate({ monthlySalary: 15000 }).brackets.labor).toBe(29500);
  });
  it('part-time applies to prorated too', () => {
    const r = engine.calculateProrated({ monthlySalary: 15000, startDate: '2026-03-08', partTime: true });
    expect(r.brackets.labor).toBe(15840);
    expect(r.brackets.occupational).toBe(29500);
  });
});

describe('foreign identities', () => {
  const engine = createPayrollEngine({ year: 2026 });
  it('一般移工 (migrantGeneral): 勞保 11.5% only, no 就保, no 勞退', () => {
    const r = engine.calculate({ monthlySalary: 30000, identity: 'migrantGeneral' });
    expect(r.brackets.labor).toBe(30300);
    expect(r.employee.labor).toBe(697); // 30300 x 11.5% x 20%
    expect(r.government.labor).toBe(348);
    expect(r.brackets.pension).toBe(0);
    expect(r.employer.pension).toBe(0);
    expect(r.employee.pensionSelf).toBe(0);
    expect(r.employee.health).toBe(470);
    expect(r.employer.occupational).toBe(64);
  });
  it('migrantGeneral forces 11.5% even when employmentInsurance=true', () => {
    expect(engine.calculate({ monthlySalary: 30000, identity: 'migrantGeneral', employmentInsurance: true }).employee.labor).toBe(697);
  });
  it('家事移工 (migrantDomestic): no 勞保/勞退; only 健保 + 職災', () => {
    const r = engine.calculate({ monthlySalary: 30000, identity: 'migrantDomestic', occupationalRate: 0.0018 });
    expect(r.brackets.labor).toBe(0);
    expect(r.employee.labor).toBe(0);
    expect(r.government.labor).toBe(0);
    expect(r.brackets.pension).toBe(0);
    expect(r.employer.pension).toBe(0);
    expect(r.employee.health).toBe(470);
    expect(r.employer.occupational).toBe(55); // 30300 x 0.18%
  });
  it('still rejects a truly unknown identity', () => {
    expect(() => engine.calculate({ monthlySalary: 29500, identity: 'category9' as never })).toThrow(/identity/i);
  });
  it('migrant pension stays 0 even if pensionSelfContribution is set', () => {
    const r = engine.calculate({ monthlySalary: 30000, identity: 'migrantGeneral', pensionSelfContribution: 0.06 });
    expect(r.employee.pensionSelf).toBe(0);
    expect(r.employer.pension).toBe(0);
  });
  it('calculateProrated validates occupationalRate range', () => {
    expect(() => engine.calculateProrated({ monthlySalary: 30000, startDate: '2026-03-08', occupationalRate: 0.89 })).toThrow(/occupationalRate/);
  });
  it('migrantDomestic prorated: labor/pension zero, health/occupational present', () => {
    const r = engine.calculateProrated({ monthlySalary: 30000, startDate: '2026-03-08', identity: 'migrantDomestic', occupationalRate: 0.0018 });
    expect(r.employee.labor).toBe(0);
    expect(r.employer.pension).toBe(0);
    expect(r.brackets.labor).toBe(0);
    expect(r.employee.health).toBeGreaterThan(0);
    expect(r.employer.occupational).toBeGreaterThan(0);
  });
  it('migrantGeneral prorated: labor present, pension zero', () => {
    const r = engine.calculateProrated({ monthlySalary: 30000, startDate: '2026-03-08', identity: 'migrantGeneral' });
    expect(r.brackets.labor).toBe(30300);
    expect(r.employer.pension).toBe(0);
    expect(r.brackets.pension).toBe(0);
  });
});

const laborSample: Bracket[] = [
  { grade: 1, min: 0, max: 29500, insuredSalary: 29500 },
  { grade: 2, min: 29501, max: 30300, insuredSalary: 30300 },
  { grade: 3, min: 30301, max: null, insuredSalary: 45800 },
];

describe('findBracket', () => {
  it('maps a salary between two grades to the higher grade', () => {
    expect(findBracket(laborSample, 30000).insuredSalary).toBe(30300);
  });
  it('maps exactly on a boundary to that grade', () => {
    expect(findBracket(laborSample, 29500).insuredSalary).toBe(29500);
  });
  it('maps below the lowest grade to grade 1', () => {
    expect(findBracket(laborSample, 20000).insuredSalary).toBe(29500);
  });
  it('caps at the top grade', () => {
    expect(findBracket(laborSample, 999999).insuredSalary).toBe(45800);
  });
});

describe('calcLaborInsurance', () => {
  it('grade 1 with employment insurance: employee 738', () => {
    const r = calcLaborInsurance(D, 29500, true, 'round');
    expect(r.insured).toBe(29500);
    expect(r.employee).toBe(738);
    expect(r.employer).toBe(2581);
    expect(r.government).toBe(369);
  });
  it('without employment insurance uses 11.5%', () => {
    expect(calcLaborInsurance(D, 29500, false, 'round').employee).toBe(679);
  });
  it('caps at the top labor grade 45800', () => {
    const r = calcLaborInsurance(D, 200000, true, 'round');
    expect(r.insured).toBe(45800);
    expect(r.employee).toBe(1145);
  });
});

describe('calcHealthInsurance (per-person rounding)', () => {
  it('grade 1, no dependents', () => {
    const r = calcHealthInsurance(D, 29500, 0, 'round');
    expect(r.insured).toBe(29500);
    expect(r.employee).toBe(458);
    expect(r.employer).toBe(1428);
    expect(r.government).toBe(238);
  });
  it('grade 9 (42000), no dependents', () => {
    const r = calcHealthInsurance(D, 42000, 0, 'round');
    expect(r.employee).toBe(651);
    expect(r.employer).toBe(2032);
    expect(r.government).toBe(339);
  });
  it('grade 9 with 1 dependent: per-person 651 x 2 = 1302', () => {
    expect(calcHealthInsurance(D, 42000, 1, 'round').employee).toBe(1302);
  });
  it('dependents charged are capped at 3', () => {
    const three = calcHealthInsurance(D, 42000, 3, 'round').employee;
    const five = calcHealthInsurance(D, 42000, 5, 'round').employee;
    expect(five).toBe(three);
    expect(three).toBe(651 * 4);
  });
  it('a non-integer dependents count is floored, never producing a fractional premium', () => {
    const r = calcHealthInsurance(D, 42000, 1.7, 'round').employee;
    expect(r).toBe(651 * 2); // floor(1.7) = 1 dependent
    expect(Number.isInteger(r)).toBe(true);
  });
});

describe('calcPension', () => {
  it('employer 6% of pension-table insured', () => {
    const r = calcPension(D, 42000, 0, 'round');
    expect(r.insured).toBe(42000);
    expect(r.employer).toBe(2520);
    expect(r.self).toBe(0);
  });
  it('voluntary self-contribution at 6%', () => {
    expect(calcPension(D, 42000, 0.06, 'round').self).toBe(2520);
  });
  it('handles fine self-contribution rates without scientific-notation misparse', () => {
    expect(calcPension(D, 42000, 0.045, 'round').self).toBe(1890); // 42000 x 4.5% = 1890
    expect(calcPension(D, 42000, 1e-8, 'round').self).toBe(0); // 42000 x 1e-8 ≈ 0, not full salary
    expect(calcPension(D, 42000, -0.1, 'round').self).toBe(0); // clamped to 0
  });
  it('caps at pension top grade 150000', () => {
    const r = calcPension(D, 200000, 0, 'round');
    expect(r.insured).toBe(150000);
    expect(r.employer).toBe(9000);
  });
});

describe('createPayrollEngine().calculate', () => {
  const engine = createPayrollEngine({ year: 2026 });

  it('assembles a full result for a 42000 category-1 employee, 1 dependent, self 6%', () => {
    const r = engine.calculate({
      monthlySalary: 42000,
      identity: 'category1',
      dependents: 1,
      employmentInsurance: true,
      pensionSelfContribution: 0.06,
    });
    expect(r.brackets).toEqual({ labor: 42000, health: 42000, pension: 42000, occupational: 42000 });
    expect(r.employee).toEqual({ labor: 1050, health: 1302, pensionSelf: 2520, total: 1050 + 1302 + 2520 });
    expect(r.employer).toEqual({ labor: 3675, health: 2032, pension: 2520, occupational: 88, total: 3675 + 2032 + 2520 + 88 });
    expect(r.government).toEqual({ labor: 525, health: 339 });
    expect(r.meta).toEqual({ year: 2026, dataVersion: '2026.1.0' });
  });

  it('applies sensible defaults (category1, EI on, no dependents, no self)', () => {
    const r = engine.calculate({ monthlySalary: 29500 });
    expect(r.employee.labor).toBe(738);
    expect(r.employee.health).toBe(458);
    expect(r.employee.pensionSelf).toBe(0);
  });

  it('throws for an unsupported identity', () => {
    expect(() => engine.calculate({ monthlySalary: 29500, identity: 'category2' as never })).toThrow(/identity/i);
  });

  it('throws for invalid monthlySalary (NaN, negative)', () => {
    expect(() => engine.calculate({ monthlySalary: NaN })).toThrow(/monthlySalary/);
    expect(() => engine.calculate({ monthlySalary: -1 })).toThrow(/monthlySalary/);
    expect(() => engine.calculate({ monthlySalary: Infinity })).toThrow(/monthlySalary/);
  });

  it('throws for non-finite dependents / pensionSelfContribution instead of returning NaN', () => {
    expect(() => engine.calculate({ monthlySalary: 42000, dependents: NaN })).toThrow(/dependents/);
    expect(() => engine.calculate({ monthlySalary: 42000, pensionSelfContribution: NaN })).toThrow(/pensionSelfContribution/);
  });

  it('accepts an occupationalRate override and validates its range', () => {
    expect(engine.calculate({ monthlySalary: 29500, occupationalRate: 0.0089 }).employer.occupational).toBe(263); // 262.55 -> 263
    expect(() => engine.calculate({ monthlySalary: 29500, occupationalRate: 0.89 })).toThrow(/occupationalRate/);
    expect(() => engine.calculate({ monthlySalary: 29500, occupationalRate: -1 })).toThrow(/occupationalRate/);
  });

  it('throws for an unknown year', () => {
    expect(() => createPayrollEngine({ year: 1999 })).toThrow(/year/i);
  });

  it('exposes the available years and per-year metadata', () => {
    expect(getAvailableYears()).toEqual([2024, 2025, 2026]);
    const d = getYearData(2026);
    expect(d.dataVersion).toBe('2026.1.0');
    expect(d.minimumWage).toEqual({ monthly: 29500, hourly: 196 });
    const d2024 = getYearData(2024);
    expect(d2024.dataVersion).toBe('2024.1.0');
    expect(d2024.minimumWage).toEqual({ monthly: 27470, hourly: 183 });
  });
});

describe('calcEmployerSupplementary (雇主端補充保費)', () => {
  it('官方彩虹案例：(500萬 − 420萬) × 2.11% = 16,880', () => {
    const r = calcEmployerSupplementary(D, { monthlyPaidTotal: 5_000_000, monthlyInsuredTotal: 4_200_000 }, 'round');
    expect(r.base).toBe(800_000);
    expect(r.rate).toBe('0.0211');
    expect(r.premium).toBe(16_880);
  });

  it('投保總額≥薪資總額 → base 與 premium 皆 0', () => {
    const r = calcEmployerSupplementary(D, { monthlyPaidTotal: 4_000_000, monthlyInsuredTotal: 4_200_000 }, 'round');
    expect(r.base).toBe(0);
    expect(r.premium).toBe(0);
  });

  it('負數或 NaN 輸入丟錯', () => {
    expect(() => calcEmployerSupplementary(D, { monthlyPaidTotal: -1, monthlyInsuredTotal: 0 }, 'round')).toThrow();
    expect(() => calcEmployerSupplementary(D, { monthlyPaidTotal: NaN, monthlyInsuredTotal: 0 }, 'round')).toThrow();
    expect(() => calcEmployerSupplementary(D, { monthlyPaidTotal: 0, monthlyInsuredTotal: -1 }, 'round')).toThrow();
  });

  it('引擎方法委派、rounding 預設 round', () => {
    const eng = createPayrollEngine({ year: 2026 });
    expect(eng.calculateEmployerSupplementary({ monthlyPaidTotal: 5_000_000, monthlyInsuredTotal: 4_200_000 }).premium).toBe(16_880);
  });
});

describe('calcWithholding (薪資所得扣繳)', () => {
  it('居住者公式法：月薪60000/扶養0 → 每月500', () => {
    const r = calcWithholding(D, { type: 'resident', monthlySalary: 60000 });
    expect(r.withholding).toBe(500);
    expect(r.rate).toBe('0.05');
    expect(r.taxableAnnual).toBe(120000);
  });
  it('居住者公式法：月薪100000/扶養2 → 每月1658', () => {
    expect(calcWithholding(D, { type: 'resident', monthlySalary: 100000, dependents: 2 }).withholding).toBe(1658);
  });
  it('居住者起扣點：月薪50000/扶養0 → 0', () => {
    expect(calcWithholding(D, { type: 'resident', monthlySalary: 50000 }).withholding).toBe(0);
  });
  it('獎金 100000 → 5000；90000 → 0', () => {
    expect(calcWithholding(D, { type: 'residentBonus', amount: 100000 }).withholding).toBe(5000);
    expect(calcWithholding(D, { type: 'residentBonus', amount: 90000 }).withholding).toBe(0);
  });
  it('非居住者：月薪40000 → 2400(6%)；50000 → 9000(18%)', () => {
    expect(calcWithholding(D, { type: 'nonResident', monthlySalary: 40000 }).withholding).toBe(2400);
    expect(calcWithholding(D, { type: 'nonResident', monthlySalary: 40000 }).rate).toBe('0.06');
    expect(calcWithholding(D, { type: 'nonResident', monthlySalary: 50000 }).withholding).toBe(9000);
  });
  it('負數丟錯', () => {
    expect(() => calcWithholding(D, { type: 'resident', monthlySalary: -1 })).toThrow();
    expect(() => calcWithholding(D, { type: 'residentBonus', amount: -1 })).toThrow();
  });
  it('該年度無 incomeTax 丟明確錯誤', () => {
    const noTax = { ...D, incomeTax: undefined } as typeof D;
    expect(() => calcWithholding(noTax, { type: 'resident', monthlySalary: 60000 })).toThrow(/incomeTax|所得稅/);
  });
  it('引擎方法委派', () => {
    expect(createPayrollEngine({ year: 2026 }).calculateWithholding({ type: 'resident', monthlySalary: 60000 }).withholding).toBe(500);
  });
});
