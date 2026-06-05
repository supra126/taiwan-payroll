import type { YearData } from './types';
import data2026 from '../../../data/2026.json';
import data2025 from '../../../data/2025.json';
import data2024 from '../../../data/2024.json';

const registry: Record<number, YearData> = {
  2026: data2026 as unknown as YearData,
  2025: data2025 as unknown as YearData,
  2024: data2024 as unknown as YearData,
};

export function getYearData(year: number): YearData {
  const d = registry[year];
  if (!d) throw new Error(`No data for year ${year}. Available: ${Object.keys(registry).join(', ')}`);
  return d;
}

export function getAvailableYears(): number[] {
  return Object.keys(registry)
    .map(Number)
    .sort((a, b) => a - b);
}
