/** Group thousands with commas, locale-independent (e.g. 211000 -> "211,000"). */
export function formatNTD(n: number): string {
  return Math.trunc(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Render a decimal-rate string as a percent, trimming trailing zeros ("0.0211" -> "2.11%"). */
export function formatRate(rate: string): string {
  const pct = Number(rate) * 100;
  return `${parseFloat(pct.toFixed(4))}%`;
}
