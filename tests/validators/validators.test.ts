import { describe, expect, it } from 'vitest';
import type { ValidatorDefinition } from '../../src/domain/form-definition';
import { validateNamed } from '../../src/domain/validators';

function result(type: ValidatorDefinition['type'], value: unknown, limit?: number) {
  return validateNamed(value as never, {
    type,
    value: limit,
    error_code: 'INVALID',
  }).valid;
}

describe('named validators', () => {
  it('checks length immediately before, at, and after the boundary', () => {
    expect(result('minLength', 'a', 2)).toBe(false);
    expect(result('minLength', 'ab', 2)).toBe(true);
    expect(result('minLength', 'abc', 2)).toBe(true);
    expect(result('maxLength', 'abc', 2)).toBe(false);
  });

  it('checks numeric boundaries without coercion', () => {
    expect(result('minValue', 19, 20)).toBe(false);
    expect(result('minValue', 20, 20)).toBe(true);
    expect(result('maxValue', 21, 20)).toBe(false);
    expect(result('minValue', '20', 20)).toBe(false);
  });

  it.each([
    ['email', 'demo@example.invalid', true],
    ['email', 'not-an-email', false],
    ['postalCodeJP', '0000000', true],
    ['postalCodeJP', '000-0000', false],
    ['phoneJP', '0312345678', true],
    ['phoneJP', '09012345678', true],
    ['phoneJP', '03-1234-5678', false],
    ['katakana', 'サンプル　テスト', true],
    ['katakana', 'さんぷる', false],
    ['date', '2000-02-29', true],
    ['date', '2001-02-29', false],
  ] as const)('validates %s for %s', (type, value, expected) => {
    expect(result(type, value)).toBe(expected);
  });

  it('leaves required handling separate', () => {
    expect(result('email', '')).toBe(true);
    expect(result('email', null)).toBe(true);
    expect(result('email', undefined)).toBe(true);
  });

  it('rejects incorrect types and accepts representative Japanese input', () => {
    expect(result('email', 123)).toBe(false);
    expect(result('katakana', 'ヴァーチャル　バンク')).toBe(true);
  });
});
