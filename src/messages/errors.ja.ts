export const errorMessages: Record<string, string> = {
  REQUIRED: '入力してください',
  NAME_TOO_SHORT: '氏名は2文字以上で入力してください',
  NAME_TOO_LONG: '氏名は60文字以内で入力してください',
  KATAKANA_INVALID: '氏名（カナ）は全角カタカナで入力してください',
  NAME_KANA_TOO_LONG: '氏名（カナ）は60文字以内で入力してください',
  DATE_INVALID: '生年月日は実在する日付を入力してください',
  EMAIL_TOO_LONG: 'メールアドレスは254文字以内で入力してください',
  EMAIL_INVALID: 'メールアドレスを正しい形式で入力してください',
  PHONE_INVALID: '電話番号はハイフンなしの10桁または11桁で入力してください',
  POSTAL_CODE_INVALID: '郵便番号はハイフンなしの7桁で入力してください',
  SUBMISSION_FAILED: '送信を確認できませんでした。もう一度お試しください',
};

export function getErrorMessage(errorCode: string): string {
  return errorMessages[errorCode] ?? '入力内容を確認してください';
}
