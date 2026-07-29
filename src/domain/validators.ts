import type { AnswerValue } from './answers';
import type { ValidatorDefinition } from './form-definition';

export type ValidationResult = { valid: true } | { valid: false; errorCode: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const POSTAL_CODE_JP_PATTERN = /^\d{7}$/u;
const PHONE_JP_PATTERN = /^0\d{9,10}$/u;
const KATAKANA_PATTERN = /^[ァ-ヶー\u3000\s]+$/u;

function isBlank(value: AnswerValue): boolean {
  return value === undefined || value === null || value === '';
}

function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function validateNamed(
  value: AnswerValue,
  validator: ValidatorDefinition,
): ValidationResult {
  if (isBlank(value)) return { valid: true };

  let valid = false;
  switch (validator.type) {
    case 'minLength':
      valid = typeof value === 'string' && value.length >= (validator.value ?? 0);
      break;
    case 'maxLength':
      valid = typeof value === 'string' && value.length <= (validator.value ?? 0);
      break;
    case 'minValue':
      valid = typeof value === 'number' && value >= (validator.value ?? Number.NEGATIVE_INFINITY);
      break;
    case 'maxValue':
      valid = typeof value === 'number' && value <= (validator.value ?? Number.POSITIVE_INFINITY);
      break;
    case 'email':
      valid = typeof value === 'string' && EMAIL_PATTERN.test(value);
      break;
    case 'postalCodeJP':
      valid = typeof value === 'string' && POSTAL_CODE_JP_PATTERN.test(value);
      break;
    case 'phoneJP':
      valid = typeof value === 'string' && PHONE_JP_PATTERN.test(value);
      break;
    case 'katakana':
      valid = typeof value === 'string' && KATAKANA_PATTERN.test(value);
      break;
    case 'date':
      valid = typeof value === 'string' && isRealIsoDate(value);
      break;
  }

  return valid ? { valid: true } : { valid: false, errorCode: validator.error_code };
}

export function validateNamedList(
  value: AnswerValue,
  validators: ValidatorDefinition[] = [],
): ValidationResult {
  for (const validator of validators) {
    const result = validateNamed(value, validator);
    if (!result.valid) return result;
  }
  return { valid: true };
}
