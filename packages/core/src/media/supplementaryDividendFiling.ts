import type { SupplementaryDividendFilingInput, SupplementaryBonusFilingResult } from '../types';
import { assertNonNeg, rocYMD, buildHeaderRow, buildContent, buildFilename, rangeYM, validateUnitAndDate } from './supplementaryFilingCommon';

// 逐字複製自 testdata/media/supplementary-dividend-2022-example.csv 第 1、3 行（表頭結尾 5 逗號；明細 17 欄）
const HEADER_COMMENT =
  '*資料識別碼,統一編號,所得類別,給付起始年月,給付結束年月,申報總筆數,所得(收入)給付總額,扣繳補充保險費總額,扣費義務人名稱,聯絡電話,電子郵件信箱,聯絡人姓名,,,,,';
const DETAIL_COMMENT =
  '*資料識別碼,處理方式(新增I  覆蓋R),給付日期,所得人身分證號,所得人姓名,單次給付金額,扣繳補充保險費金額,申報編號(詳格式說明),信託註記,扣取時可扣抵稅額,年度確定可扣抵稅額,股利所屬期間以雇主身分投保期間之投保金額總額,除權(息)基準日期,股利註記,特殊註記,股利所屬期間起迄年月,股利所屬年度';

export function generateSupplementaryDividendFiling(
  input: SupplementaryDividendFilingInput,
): SupplementaryBonusFilingResult {
  const { unit, records } = input;
  if (records.length === 0) throw new Error('records must not be empty');
  validateUnitAndDate(unit.taxId, input.filingDate);
  for (const r of records) {
    if (!/^\d{8}$/.test(r.payDate)) throw new Error(`payDate must be YYYYMMDD, got ${r.payDate}`);
    if (!/^\d{8}$/.test(r.exDividendDate)) throw new Error(`exDividendDate must be YYYYMMDD, got ${r.exDividendDate}`);
    assertNonNeg('amount', r.amount);
    assertNonNeg('premium', r.premium);
  }
  const { start, end } = rangeYM(records.map((r) => r.payDate));
  const headerRow = buildHeaderRow(unit, '66', start, end, records.length,
    records.reduce((s, r) => s + r.amount, 0), records.reduce((s, r) => s + r.premium, 0)) + ',,,,,';
  const detailRows = records.map((r) =>
    ['2', r.action, rocYMD(r.payDate), r.payeeId, r.payeeName, String(r.amount), String(r.premium),
     r.filingNo ?? '1', r.trustNote ?? '', String(r.creditableTaxWithholding ?? 0), String(r.creditableTaxFinal ?? 0),
     r.employerInsuredTotal != null ? String(r.employerInsuredTotal) : '', rocYMD(r.exDividendDate), r.dividendType,
     r.specialNote ?? '', r.belongingPeriod ?? '', r.belongingYear ?? ''].join(','));
  return {
    filename: buildFilename(unit.taxId, input.filingDate, input.sequence ?? '001'),
    content: buildContent(HEADER_COMMENT, headerRow, DETAIL_COMMENT, detailRows),
  };
}
