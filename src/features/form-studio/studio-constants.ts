import type { FieldControlType } from '../../domain/form-definition';

export const controlLabels: Record<FieldControlType, string> = {
  text: 'テキスト',
  email: 'メール',
  tel: '電話番号',
  number: '数値',
  date: '日付',
  radio: 'ラジオ',
  select: 'セレクト',
  checkbox: 'チェックボックス',
};
