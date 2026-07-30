import { expect, test } from '@playwright/test';

test('200 percent visual scaling keeps the primary action available without horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ width: 780, height: 844 });
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByRole('button', { name: '内容を理解してデモを始める' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
test('studio remains operable at 200 percent visual scaling', async ({ page }) => {
  await page.setViewportSize({ width: 780, height: 844 });
  await page.goto('/studio');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.getByRole('button', { name: 'JSON読込' })).toBeVisible();
  await expect(page.getByRole('tab', { name: '構成' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
