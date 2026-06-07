import type {
  SupplementaryBonusFilingInput,
  SupplementaryBonusFilingResult,
  SupplementaryBonusRecord,
} from '../types';
import { getYearData } from '../data';
import { calcSupplementary } from '../engine/supplementary';

const NL = '\r\n';
const FW = '　';
const INCOME_TYPE = '62';
// 逐字複製自 testdata/media/supplementary-bonus-2022-example.csv 第 1、3 行（勿改動，含半形空格/括號）
const HEADER_COMMENT =
  '*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人,聯絡電話,電子郵件信箱,聯絡人姓名';
const DETAIL_COMMENT =
  '*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次獎金給付金額,扣繳補充保險費金額,申報編號(詳格式說明),投保單位代號,扣費當月投保金額,同年度累計獎金金額,資料註記';

function assertNonNeg(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be a finite non-negative number, got ${v}`);
}
function rocYM(d: string): string {
  return String(Number(d.slice(0, 4)) - 1911).padStart(3, '0') + d.slice(4, 6);
}
function rocYMD(d: string): string {
  return String(Number(d.slice(0, 4)) - 1911).padStart(3, '0') + d.slice(4);
}
function padFW(s: string, n: number): string {
  const cp = [...s];
  return cp.length >= n ? cp.slice(0, n).join('') : s + FW.repeat(n - cp.length);
}
function premiumOf(year: number, r: SupplementaryBonusRecord): number {
  return calcSupplementary(
    getYearData(year),
    { type: 'bonus', amount: r.bonusAmount, monthlyInsuredSalary: r.insuredSalary, ytdBonus: r.ytdBonusCumulative - r.bonusAmount },
    'round',
  ).premium;
}

export function generateSupplementaryBonusFiling(input: SupplementaryBonusFilingInput): SupplementaryBonusFilingResult {
  const { unit, records, year } = input;
  if (records.length === 0) throw new Error('records must not be empty');
  if (!/^\d{8}$/.test(input.filingDate)) throw new Error(`filingDate must be YYYYMMDD, got ${input.filingDate}`);
  if (unit.taxId.length !== 8) throw new Error(`taxId must be 8 digits, got ${unit.taxId}`);
  for (const r of records) {
    if (!/^\d{8}$/.test(r.payDate)) throw new Error(`payDate must be YYYYMMDD, got ${r.payDate}`);
    assertNonNeg('bonusAmount', r.bonusAmount);
    assertNonNeg('insuredSalary', r.insuredSalary);
    assertNonNeg('ytdBonusCumulative', r.ytdBonusCumulative);
  }
  const yms = records.map((r) => rocYM(r.payDate));
  const rocYears = new Set(yms.map((ym) => ym.slice(0, 3)));
  if (rocYears.size > 1) throw new Error('all payDate must be in the same ROC year');
  const premiums = records.map((r) => premiumOf(year, r));

  const headerRow = [
    '1', unit.taxId, INCOME_TYPE,
    yms.reduce((a, b) => (a < b ? a : b)), yms.reduce((a, b) => (a > b ? a : b)),
    String(records.length),
    String(records.reduce((s, r) => s + r.bonusAmount, 0)),
    String(premiums.reduce((s, p) => s + p, 0)),
    padFW(unit.name, 25), unit.phone, unit.email, padFW(unit.contactName, 25),
  ].join(',');

  const detailRows = records.map((r, i) =>
    ['2', r.action, rocYMD(r.payDate), r.payeeId, r.payeeName, String(r.bonusAmount), String(premiums[i]),
     r.filingNo ?? '1', r.unitCode, String(r.insuredSalary), String(r.ytdBonusCumulative), r.note ?? ''].join(','),
  );

  const content = [HEADER_COMMENT, headerRow, DETAIL_COMMENT, ...detailRows].join(NL) + NL;
  const filename = `DPR${unit.taxId}${rocYMD(input.filingDate)}${input.sequence ?? '001'}.csv`;
  return { filename, content };
}
