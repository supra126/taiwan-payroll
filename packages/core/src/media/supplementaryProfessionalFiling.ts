import type {
  SupplementaryProfessionalFilingInput,
  SupplementaryBonusFilingResult,
  SupplementaryProfessionalRecord,
} from '../types';
import { getYearData } from '../data';
import { calcSupplementary } from '../engine/supplementary';
import { assertNonNeg, rocYMD, buildHeaderRow, buildContent, buildFilename, rangeYM, validateUnitAndDate } from './supplementaryFilingCommon';

// 逐字複製自 testdata/media/supplementary-professional-2022-example.csv 第 1、3 行（含「扣費義務人名稱」「所得所屬年度,」）
const HEADER_COMMENT =
  '*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人名稱,聯絡電話,電子郵件信箱,聯絡人姓名';
const DETAIL_COMMENT =
  '*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次給付金額,扣繳補充保險費金額,申報編號(詳格式說明),信託註記,資料註記,所得所屬年度,';

function premiumOf(year: number, r: SupplementaryProfessionalRecord): number {
  return calcSupplementary(getYearData(year), { type: 'professional', amount: r.amount }, 'round').premium;
}

export function generateSupplementaryProfessionalFiling(
  input: SupplementaryProfessionalFilingInput,
): SupplementaryBonusFilingResult {
  const { unit, records, year } = input;
  if (records.length === 0) throw new Error('records must not be empty');
  validateUnitAndDate(unit.taxId, input.filingDate);
  for (const r of records) {
    if (!/^\d{8}$/.test(r.payDate)) throw new Error(`payDate must be YYYYMMDD, got ${r.payDate}`);
    assertNonNeg('amount', r.amount);
  }
  const { start, end } = rangeYM(records.map((r) => r.payDate));
  const premiums = records.map((r) => premiumOf(year, r));
  const headerRow = buildHeaderRow(unit, '65', start, end, records.length,
    records.reduce((s, r) => s + r.amount, 0), premiums.reduce((s, p) => s + p, 0));
  const detailRows = records.map((r, i) =>
    ['2', r.action, rocYMD(r.payDate), r.payeeId, r.payeeName, String(r.amount), String(premiums[i]),
     r.filingNo ?? '1', r.trustNote ?? '', r.note ?? '', r.incomeYear ?? '', ''].join(','));
  return {
    filename: buildFilename(unit.taxId, input.filingDate, input.sequence ?? '001'),
    content: buildContent(HEADER_COMMENT, headerRow, DETAIL_COMMENT, detailRows),
  };
}
