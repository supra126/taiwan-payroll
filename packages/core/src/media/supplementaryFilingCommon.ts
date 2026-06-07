export const NL = '\r\n';
export const FW = '　';

export function assertNonNeg(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be a finite non-negative number, got ${v}`);
}
export function rocYM(d: string): string {
  return String(Number(d.slice(0, 4)) - 1911).padStart(3, '0') + d.slice(4, 6);
}
export function rocYMD(d: string): string {
  return String(Number(d.slice(0, 4)) - 1911).padStart(3, '0') + d.slice(4);
}
export function padFW(s: string, n: number): string {
  const cp = [...s];
  return cp.length >= n ? cp.slice(0, n).join('') : s + FW.repeat(n - cp.length);
}
export interface FilingUnitFields {
  taxId: string; name: string; phone: string; email: string; contactName: string;
}
export function buildHeaderRow(
  unit: FilingUnitFields, incomeType: string, startYM: string, endYM: string,
  count: number, totalPay: number, totalPremium: number,
): string {
  return ['1', unit.taxId, incomeType, startYM, endYM, String(count), String(totalPay), String(totalPremium),
    padFW(unit.name, 25), unit.phone, unit.email, padFW(unit.contactName, 25)].join(',');
}
export function buildContent(headerComment: string, headerRow: string, detailComment: string, detailRows: string[]): string {
  return [headerComment, headerRow, detailComment, ...detailRows].join(NL) + NL;
}
export function buildFilename(taxId: string, filingDate: string, sequence: string): string {
  return `DPR${taxId}${rocYMD(filingDate)}${sequence}.csv`;
}
export function rangeYM(payDates: string[]): { start: string; end: string } {
  const yms = payDates.map(rocYM);
  if (new Set(yms.map((y) => y.slice(0, 3))).size > 1) throw new Error('all payDate must be in the same ROC year');
  return { start: yms.reduce((a, b) => (a < b ? a : b)), end: yms.reduce((a, b) => (a > b ? a : b)) };
}
export function validateUnitAndDate(taxId: string, filingDate: string): void {
  if (!/^\d{8}$/.test(filingDate)) throw new Error(`filingDate must be YYYYMMDD, got ${filingDate}`);
  if (taxId.length !== 8) throw new Error(`taxId must be 8 digits, got ${taxId}`);
}
