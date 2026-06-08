import type { MetadataRoute } from 'next';

const BASE = 'https://taiwan-payroll.vercel.app';
// 內容最後實質更新日（改版時手動更新；lastmod 是 Google 真正會參考的新鮮度訊號）。
const LAST_MODIFIED = '2026-06-08';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 1 },
    { url: `${BASE}/docs`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/docs/api`, lastModified: LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
