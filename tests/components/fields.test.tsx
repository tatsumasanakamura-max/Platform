import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../../src/components/fields/TextField';
import { RadioGroupField } from '../../src/components/fields/RadioGroupField';
import { ErrorSummary } from '../../src/components/errors/ErrorSummary';
import { PrimaryButton } from '../../src/components/buttons/Buttons';

describe('accessible field components', () => {
  it('associates label, description, error, required and invalid state', () => {
    render(
      <TextField
        name="email"
        label="メールアドレス"
        description="合成アドレスを入力"
        value=""
        onChange={() => undefined}
        isRequired
        isInvalid
        error="正しい形式で入力してください"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'メールアドレス' });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      expect.stringContaining('正しい形式で入力してください'),
    );
  });

  it('supports keyboard navigation in a radio group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RadioGroupField
        name="housing"
        label="お住まいの形態"
        options={[
          { value: 'OWN', label: '持ち家' },
          { value: 'RENTAL', label: '賃貸' },
        ]}
        onChange={onChange}
        isRequired
      />,
    );
    const own = screen.getByRole('radio', { name: '持ち家' });
    own.focus();
    await user.keyboard('{ArrowDown}');
    expect(onChange).toHaveBeenCalledWith('RENTAL');
  });

  it('moves focus from an error summary to the matching field', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <>
        <ErrorSummary
          errors={[{ fieldId: 'email', message: 'メールを確認してください' }]}
          focusRequestId={1}
        />
        <label>
          メール
          <input name="email" />
        </label>
      </>,
    );
    expect(screen.getByRole('alert')).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'メールを確認してください' }));
    expect(screen.getByRole('textbox', { name: 'メール' })).toHaveFocus();

    rerender(
      <>
        <ErrorSummary
          errors={[{ fieldId: 'email', message: 'メール形式を確認してください' }]}
          focusRequestId={1}
        />
        <label>
          メール
          <input name="email" />
        </label>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'メール' })).toHaveFocus();
  });

  it('shows a textual pending state and prevents another press', () => {
    render(
      <PrimaryButton isPending onPress={() => undefined}>
        送信する
      </PrimaryButton>,
    );
    expect(screen.getByRole('button', { name: '処理しています…' })).toBeDisabled();
  });
});
