import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function begin(page: Page) {
  await page.goto('/');
  await expect(page.getByText('本番利用できない技術検証デモです')).toBeVisible();
  await page.getByRole('button', { name: '内容を理解してデモを始める' }).click();
}

async function fillValidPersonalData(page: Page) {
  await page.getByRole('textbox', { name: '氏名', exact: true }).fill('サンプル テスト');
  await page.getByRole('textbox', { name: '氏名（カナ）' }).fill('サンプル　テスト');
  await page.getByLabel('生年月日').fill('2000-02-29');
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill('demo@example.invalid');
  await page.getByRole('textbox', { name: '電話番号' }).fill('0312345678');
  await page.getByRole('textbox', { name: '郵便番号' }).fill('0000000');
  const rental = page.getByRole('radio', { name: '賃貸住宅' });
  await rental.focus();
  await rental.press('Space');
}

test('normal synthetic-data journey reaches completion and blocks double submission', async ({
  page,
}) => {
  await begin(page);
  await fillValidPersonalData(page);
  await page.getByRole('button', { name: '入力内容を確認する' }).click();
  await expect(page.getByRole('heading', { name: '入力内容を確認してください' })).toBeVisible();
  const submit = page.getByRole('button', { name: 'APIスタブへ送信する' });
  await submit.click();
  await expect(page.getByRole('button', { name: '処理しています…' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: '技術検証が完了しました' })).toBeVisible();
  await expect(page.getByText('実際の申込みや審査は行われていません。')).toBeVisible();
});

test('required errors appear in summary and can be corrected', async ({ page }) => {
  await begin(page);
  await page.getByRole('button', { name: '入力内容を確認する' }).click();
  const summary = page.getByRole('alert');
  await expect(summary).toBeFocused();
  await expect(summary.getByRole('button')).toHaveCount(7);
  await summary.getByRole('button', { name: '氏名を入力してください', exact: true }).click();
  await expect(page.getByRole('textbox', { name: '氏名', exact: true })).toBeFocused();
  await fillValidPersonalData(page);
  await page.getByRole('button', { name: '入力内容を確認する' }).click();
  await expect(page.getByRole('heading', { name: '入力内容を確認してください' })).toBeVisible();
});

test('email and postal code show specific recovery guidance', async ({ page }) => {
  await begin(page);
  await page.getByRole('textbox', { name: 'メールアドレス' }).fill('invalid');
  await page.getByRole('textbox', { name: 'メールアドレス' }).blur();
  await expect(page.getByRole('textbox', { name: 'メールアドレス' })).toHaveAccessibleDescription(
    /メールアドレスを正しい形式で入力してください/,
  );
  await page.getByRole('textbox', { name: '郵便番号' }).fill('000-0000');
  await page.getByRole('textbox', { name: '郵便番号' }).blur();
  await expect(page.getByRole('textbox', { name: '郵便番号' })).toHaveAccessibleDescription(
    /郵便番号はハイフンなしの7桁で入力してください/,
  );
});

test('back and confirmation edit preserve answers', async ({ page }) => {
  await begin(page);
  await page.getByRole('textbox', { name: '氏名', exact: true }).fill('サンプル テスト');
  await page.goBack();
  await expect(
    page.getByRole('heading', { name: 'カードローン申込フォーム技術検証' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '内容を理解してデモを始める' }).click();
  await expect(page.getByRole('textbox', { name: '氏名', exact: true })).toHaveValue(
    'サンプル テスト',
  );
  await fillValidPersonalData(page);
  await page.getByRole('button', { name: '入力内容を確認する' }).click();
  await page.getByRole('button', { name: '入力内容を修正する' }).click();
  await expect(page.getByRole('textbox', { name: 'メールアドレス' })).toHaveValue(
    'demo@example.invalid',
  );
});

test('keyboard flow and accessibility have no serious or critical axe violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '本人情報について' })).toBeVisible();
  await fillValidPersonalData(page);
  const results = await new AxeBuilder({ page })
    .disableRules(['landmark-unique'])
    .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
    .analyze();
  expect(
    results.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    ),
  ).toEqual([]);
});

test('mobile widths do not create horizontal scrolling', async ({ page }) => {
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await begin(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  }
});
