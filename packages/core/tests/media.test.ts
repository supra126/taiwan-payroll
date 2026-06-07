import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateSupplementaryBonusFiling } from '../src/media/supplementaryBonusFiling';
import { generateSupplementaryParttimeFiling } from '../src/media/supplementaryParttimeFiling';
import { generateSupplementaryProfessionalFiling } from '../src/media/supplementaryProfessionalFiling';
import type { SupplementaryBonusFilingInput, SupplementaryParttimeFilingInput, SupplementaryProfessionalFilingInput } from '../src/types';

const fixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-bonus-2022-example.csv', import.meta.url)),
  'utf8',
);

const ptFixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-parttime-2022-example.csv', import.meta.url)),
  'utf8',
);
const ptExample: SupplementaryParttimeFilingInput = {
  year: 2026,
  filingDate: '20220901',
  unit: { taxId: '11111111', name: '甄健康有限公司', phone: '0227065866#0123', email: 'chuan@mail.tw', contactName: '陳一一' },
  records: [
    { action: 'I', payDate: '20220228', payeeId: 'A222222222', payeeName: '甄健康', amount: 30000, filingNo: '1' },
    { action: 'I', payDate: '20220418', payeeId: 'A222222222', payeeName: '甄健康', amount: 30000, filingNo: '1' },
    { action: 'I', payDate: '20220529', payeeId: 'A222222222', payeeName: '甄健康', amount: 30000, filingNo: '1' },
    { action: 'I', payDate: '20220529', payeeId: 'A222222222', payeeName: '甄健康', amount: 30000, filingNo: '2' },
  ],
};

const example: SupplementaryBonusFilingInput = {
  year: 2026,
  filingDate: '20220901',
  unit: { taxId: '11111111', name: '甄健康有限公司', phone: '0227065866#0123', email: 'chuan@mail.tw', contactName: '陳一一' },
  records: [
    { action: 'I', payDate: '20220615', payeeId: 'A222222222', payeeName: '甄健康', bonusAmount: 50000, insuredSalary: 31800, ytdBonusCumulative: 150000, unitCode: '123456789' },
    { action: 'I', payDate: '20220715', payeeId: 'A222222222', payeeName: '甄健康', bonusAmount: 15000, insuredSalary: 30300, ytdBonusCumulative: 165000, unitCode: '123456789' },
    { action: 'I', payDate: '20220815', payeeId: 'A222222222', payeeName: '甄健康', bonusAmount: 15000, insuredSalary: 30300, ytdBonusCumulative: 180000, unitCode: '123456789' },
  ],
};

describe('generateSupplementaryBonusFiling', () => {
  it('逐字元重現官方範例 (dl-9062)', () => {
    expect(generateSupplementaryBonusFiling(example).content).toBe(fixture);
  });
  it('檔名規則 DPR+統編+民國日期+序號', () => {
    // filingDate 20220901 → 民國 1110901；DPR + 11111111 + 1110901 + 001 + .csv
    expect(generateSupplementaryBonusFiling(example).filename).toBe('DPR111111111110901001.csv');
  });
  it('表頭名稱補全形空白至 25、明細姓名不補', () => {
    const c = generateSupplementaryBonusFiling(example).content;
    expect(c).toContain('甄健康有限公司　　　　　　　　　　　　　　　　　　,'); // name 7+18
    expect(c).toContain(',甄健康,50000,'); // payeeName 不補
  });
  it('跨年度給付丟錯', () => {
    expect(() => generateSupplementaryBonusFiling({ ...example, records: [example.records[0], { ...example.records[1], payDate: '20230715' }] })).toThrow();
  });
  it('負值/空清單丟錯', () => {
    expect(() => generateSupplementaryBonusFiling({ ...example, records: [] })).toThrow();
    expect(() => generateSupplementaryBonusFiling({ ...example, records: [{ ...example.records[0], bonusAmount: -1 }] })).toThrow();
  });
});

const profFixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-professional-2022-example.csv', import.meta.url)),
  'utf8',
);
const profExample: SupplementaryProfessionalFilingInput = {
  year: 2026,
  filingDate: '20220901',
  unit: { taxId: '11111111', name: '甄健康有限公司', phone: '0227065866#0123', email: 'chuan@mail.tw', contactName: '陳一一' },
  records: ([['20220101', '1'], ['20220301', '1'], ['20220601', '1'], ['20220901', '1'], ['20221201', '1'], ['20221201', '2']] as const).map(
    ([payDate, filingNo]) => ({ action: 'I' as const, payDate, payeeId: 'A222222222', payeeName: '甄健康', amount: 40000, filingNo }),
  ),
};

describe('generateSupplementaryProfessionalFiling', () => {
  it('逐字元重現官方範例 (dl-9078, 類別65)', () => {
    expect(generateSupplementaryProfessionalFiling(profExample).content).toBe(profFixture);
  });
  it('檔名', () => {
    expect(generateSupplementaryProfessionalFiling(profExample).filename).toBe('DPR111111111110901001.csv');
  });
  it('空清單/負值/跨年度丟錯', () => {
    expect(() => generateSupplementaryProfessionalFiling({ ...profExample, records: [] })).toThrow();
    expect(() => generateSupplementaryProfessionalFiling({ ...profExample, records: [{ ...profExample.records[0], amount: -1 }] })).toThrow();
    expect(() => generateSupplementaryProfessionalFiling({ ...profExample, records: [profExample.records[0], { ...profExample.records[1], payDate: '20230301' }] })).toThrow();
  });
});

describe('generateSupplementaryParttimeFiling', () => {
  it('逐字元重現官方範例 (dl-9070, 類別63)', () => {
    expect(generateSupplementaryParttimeFiling(ptExample).content).toBe(ptFixture);
  });
  it('檔名', () => {
    expect(generateSupplementaryParttimeFiling(ptExample).filename).toBe('DPR111111111110901001.csv');
  });
  it('空清單/負值/跨年度丟錯', () => {
    expect(() => generateSupplementaryParttimeFiling({ ...ptExample, records: [] })).toThrow();
    expect(() => generateSupplementaryParttimeFiling({ ...ptExample, records: [{ ...ptExample.records[0], amount: -1 }] })).toThrow();
    expect(() => generateSupplementaryParttimeFiling({ ...ptExample, records: [ptExample.records[0], { ...ptExample.records[1], payDate: '20230418' }] })).toThrow();
  });
});
