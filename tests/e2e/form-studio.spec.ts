import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('studio edits wording and validation with an immediate shared-runtime preview', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/studio');
  await expect(page.getByRole('heading', { name: 'フォーム要件定義スタジオ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '画面構成' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'スマホプレビュー' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '項目設定' })).toBeVisible();

  await page.getByRole('tab', { name: '文言' }).click();
  const label = page.getByLabel(/ラベル/);
  await label.fill('合成氏名');
  await page.getByLabel(/プレースホルダー/).fill('架空 花子');
  await page.getByLabel(/ヘルプ/).fill('合成データの氏名だけを入力してください');
  const previewName = page.getByRole('textbox', { name: '合成氏名' });
  await expect(previewName).toHaveAttribute('placeholder', '架空 花子');
  await expect(previewName).toHaveAccessibleDescription(/合成データの氏名だけ/);

  await page.getByRole('tab', { name: '検証' }).click();
  await page
    .getByLabel('日本語エラーメッセージ')
    .first()
    .fill('氏名は2文字以上の合成データで入力してください');
  await page.getByRole('tab', { name: 'テスト' }).click();
  await page.getByLabel('テスト値').fill('架');
  await page.getByRole('button', { name: 'エラー表示をプレビュー' }).click();
  await expect(page.getByRole('alert')).toContainText(
    '氏名は2文字以上の合成データで入力してください',
  );
  await expect(previewName).toHaveAccessibleDescription(/氏名は2文字以上/);
});

test('condition, export, re-import, undo and redo preserve the executable definition', async ({
  page,
}) => {
  await page.goto('/studio');
  await page.getByRole('tab', { name: '文言' }).click();
  await page.getByLabel(/ラベル/).fill('確認用氏名');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByRole('textbox', { name: '氏名', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(page.getByRole('textbox', { name: '確認用氏名' })).toBeVisible();

  await page.getByRole('tab', { name: '条件' }).click();
  await page.getByLabel('表示条件を使用する').check();
  await expect(page.getByRole('textbox', { name: '確認用氏名' })).toHaveCount(0);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON出力' }).click();
  const saved = await downloadPromise;
  expect(saved.suggestedFilename()).toBe('form-definition.json');
  const savedPath = await saved.path();
  expect(savedPath).toBeTruthy();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(savedPath!);
  await expect(page.getByRole('status')).toContainText('検証して読み込みました');
  await expect(page.getByText('確認用氏名').first()).toBeVisible();
});

test('keyboard navigation, responsive tabs, and axe have no serious issues', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/studio');
  const first = page.locator('[data-field-item]').first();
  await first.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-field-item]').nth(1)).toBeFocused();
  await page.getByRole('button', { name: 'シナリオ' }).click();
  await page.getByLabel('代表シナリオ').selectOption({ label: '持ち家' });
  await expect(page.getByText('✓ 期待表示項目をすべて確認できました')).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('tab', { name: 'プレビュー' })).toBeVisible();
  await page.getByRole('tab', { name: 'プレビュー' }).click();
  await expect(page.getByRole('heading', { name: 'スマホプレビュー' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflow).toBe(false);
});
