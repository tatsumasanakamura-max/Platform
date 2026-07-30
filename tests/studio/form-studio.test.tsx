import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import definitionJson from '../../src/definitions/virtual-bank-basic.json';
import type { FormDefinition } from '../../src/domain/form-definition';
import { FormStudio } from '../../src/features/form-studio/FormStudio';

const definition = definitionJson as FormDefinition;

describe('FormStudio', () => {
  it('selects a field and reflects wording and required changes immediately', async () => {
    const user = userEvent.setup();
    render(<FormStudio initialDefinition={definition} />);
    await user.click(screen.getAllByTestId('field-item')[0]);
    await user.click(screen.getByRole('tab', { name: '文言' }));
    const label = screen.getByLabelText(/ラベル/);
    await user.clear(label);
    await user.type(label, '合成氏名');
    expect(screen.getAllByText('合成氏名')[0]).toBeInTheDocument();
    await user.clear(screen.getByLabelText(/プレースホルダー/));
    await user.type(screen.getByLabelText(/プレースホルダー/), '架空 花子');
    expect(screen.getByRole('textbox', { name: '合成氏名' })).toHaveAttribute(
      'placeholder',
      '架空 花子',
    );
    await user.click(screen.getByRole('tab', { name: '基本' }));
    await user.click(screen.getByLabelText('この項目を固定で必須にする'));
    expect(screen.getByText('● 未保存の変更あり')).toBeInTheDocument();
  });

  it('moves a field and supports undo and redo', async () => {
    const user = userEvent.setup();
    render(<FormStudio initialDefinition={definition} />);
    const tree = screen.getByTestId('field-tree');
    await user.click(within(tree).getAllByTestId('field-item')[1]);
    await user.click(screen.getByRole('button', { name: /氏名（カナ）を上へ移動/ }));
    expect(within(tree).getAllByTestId('field-item')[0]).toHaveAccessibleName(
      expect.stringContaining('氏名（カナ）'),
    );
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(within(tree).getAllByTestId('field-item')[0]).toHaveAccessibleName(
      expect.stringContaining('氏名 必須'),
    );
    await user.click(screen.getByRole('button', { name: 'Redo' }));
    expect(within(tree).getAllByTestId('field-item')[0]).toHaveAccessibleName(
      expect.stringContaining('氏名（カナ）'),
    );
  });

  it('requires confirmation before deletion and restores focus to cancel', async () => {
    const user = userEvent.setup();
    render(<FormStudio initialDefinition={definition} />);
    await user.click(screen.getByRole('button', { name: '削除' }));
    expect(screen.getByRole('dialog', { name: '項目を削除しますか？' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'キャンセル' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'キャンセル' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('saves only the definition draft and announces the result', async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<FormStudio initialDefinition={definition} />);
    await user.click(screen.getByRole('button', { name: '保存' }));
    expect(setItem).toHaveBeenCalledWith(
      expect.stringContaining('form-studio'),
      expect.stringContaining('virtual-card-loan-basic'),
    );
    expect(screen.getByRole('status')).toHaveTextContent('Draftをこのブラウザへ保存しました');
    setItem.mockRestore();
  });
});
