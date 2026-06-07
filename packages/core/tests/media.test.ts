import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateSupplementaryBonusFiling } from '../src/media/supplementaryBonusFiling';
import { generateSupplementaryParttimeFiling } from '../src/media/supplementaryParttimeFiling';
import { generateSupplementaryProfessionalFiling } from '../src/media/supplementaryProfessionalFiling';
import { generateSupplementaryInterestFiling } from '../src/media/supplementaryInterestFiling';
import { generateSupplementaryRentFiling } from '../src/media/supplementaryRentFiling';
import { generateSupplementaryDividendFiling } from '../src/media/supplementaryDividendFiling';
import type { SupplementaryBonusFilingInput, SupplementaryParttimeFilingInput, SupplementaryProfessionalFilingInput, SupplementaryInterestFilingInput, SupplementaryRentFilingInput, SupplementaryDividendFilingInput } from '../src/types';

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

const interestFixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-interest-2022-example.csv', import.meta.url)),
  'utf8',
);
const rentFixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-rent-2022-example.csv', import.meta.url)),
  'utf8',
);
const irUnit = { taxId: '11111111', name: '甄健康有限公司', phone: '0227065866#0123', email: 'chuan@mail.tw', contactName: '陳一一' };

const interestExample: SupplementaryInterestFilingInput = {
  year: 2026,
  filingDate: '20220901',
  unit: irUnit,
  records: ([
    ['20220130', 'A222222222', '甄健康', '1'],
    ['20220130', 'A233333333', '甄美麗', '1'],
    ['20220630', 'A222222222', '甄健康', '1'],
    ['20220630', 'A233333333', '甄美麗', '1'],
    ['20221230', 'A222222222', '甄健康', '1'],
    ['20221230', 'A233333333', '甄美麗', '1'],
    ['20221230', 'A233333333', '甄美麗', '2'],
  ] as const).map(([payDate, payeeId, payeeName, filingNo]) => ({
    action: 'I' as const,
    payDate,
    payeeId,
    payeeName,
    amount: 20000,
    filingNo,
  })),
};

const rentExample: SupplementaryRentFilingInput = {
  year: 2026,
  filingDate: '20220901',
  unit: irUnit,
  records: ([
    '20220131', '20220227', '20220329', '20220430', '20220531', '20220630',
    '20220730', '20220830', '20220930', '20221030', '20221130', '20221230',
  ] as const).map((payDate) => ({
    action: 'I' as const,
    payDate,
    payeeId: 'A222222222',
    payeeName: '甄健康',
    amount: 40000,
    filingNo: '1',
  })),
};

describe('generateSupplementaryInterestFiling', () => {
  it('逐字元重現官方範例 (dl-9094, 類別67)', () => {
    expect(generateSupplementaryInterestFiling(interestExample).content).toBe(interestFixture);
  });
  it('檔名/空清單丟錯', () => {
    expect(generateSupplementaryInterestFiling(interestExample).filename).toBe('DPR111111111110901001.csv');
    expect(() => generateSupplementaryInterestFiling({ ...interestExample, records: [] })).toThrow();
  });
});

describe('generateSupplementaryRentFiling', () => {
  it('逐字元重現官方範例 (dl-9104, 類別68)', () => {
    expect(generateSupplementaryRentFiling(rentExample).content).toBe(rentFixture);
  });
  it('負值丟錯', () => {
    expect(() => generateSupplementaryRentFiling({ ...rentExample, records: [{ ...rentExample.records[0], amount: -1 }] })).toThrow();
  });
});

const dividendFixture = readFileSync(
  fileURLToPath(new URL('../../../testdata/media/supplementary-dividend-2022-example.csv', import.meta.url)),
  'utf8',
);
const dividendExample: SupplementaryDividendFilingInput = {
  filingDate: '20220901',
  unit: { taxId: '11111111', name: '甄健康有限公司', phone: '0227065866#0123', email: 'chuan@mail.tw', contactName: '陳一一' },
  records: [
    { action: 'I', payDate: '20220715', payeeId: 'A222222222', payeeName: '甄健康', amount: 25620, premium: 541, exDividendDate: '20220601', dividendType: '3' },
    { action: 'I', payDate: '20220715', payeeId: 'A233333333', payeeName: '甄美麗', amount: 20000, premium: 422, exDividendDate: '20220601', dividendType: '3' },
    { action: 'I', payDate: '20220825', payeeId: 'A244444444', payeeName: '甄順利', amount: 3000000, premium: 17218, exDividendDate: '20220701', dividendType: '2', employerInsuredTotal: 2184000, belongingYear: '110' },
    { action: 'I', payDate: '20220915', payeeId: 'A255555555', payeeName: '甄快樂', amount: 20000, premium: 0, exDividendDate: '20220601', dividendType: '1' },
  ],
};

describe('generateSupplementaryDividendFiling', () => {
  it('逐字元重現官方範例 (dl-9086, 類別66, 17欄)', () => {
    expect(generateSupplementaryDividendFiling(dividendExample).content).toBe(dividendFixture);
  });
  it('檔名/空清單丟錯', () => {
    expect(generateSupplementaryDividendFiling(dividendExample).filename).toBe('DPR111111111110901001.csv');
    expect(() => generateSupplementaryDividendFiling({ ...dividendExample, records: [] })).toThrow();
  });
  it('負值 premium 丟錯', () => {
    expect(() => generateSupplementaryDividendFiling({ ...dividendExample, records: [{ ...dividendExample.records[0], premium: -1 }] })).toThrow();
  });
});
