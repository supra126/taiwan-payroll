import { test, expect } from '@playwright/test';

test('homepage calculator computes labor premium for 42000', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '台灣勞健保勞退試算' })).toBeVisible();
  // 42000 全月、第1類、預設就保、自提0 → 勞保員工自付 1,050
  await page.getByLabel('月薪（經常性薪資）').fill('42000');
  await expect(page.getByText('1,050')).toBeVisible();
});
