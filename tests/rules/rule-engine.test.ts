import { describe, expect, it } from 'vitest';
import { buildSubmissionPayload } from '../../src/domain/answers';
import type { Condition, FieldDefinition, FormDefinition } from '../../src/domain/form-definition';
import { evaluateCondition, isFieldRequired, isFieldVisible } from '../../src/domain/rule-engine';
import { validDefinition } from '../fixtures/valid-definition';

function condition(value: Condition, answers: Record<string, unknown>) {
  return evaluateCondition(value, answers as never);
}

describe('condition operators', () => {
  it.each([
    [{ op: 'equals', field: 'x', value: 'A' }, { x: 'A' }, true],
    [{ op: 'notEquals', field: 'x', value: 'A' }, { x: 'B' }, true],
    [{ op: 'in', field: 'x', value: ['A', 'B'] }, { x: 'B' }, true],
    [{ op: 'exists', field: 'x' }, { x: 0 }, true],
    [{ op: 'greaterThanOrEqual', field: 'x', value: 10 }, { x: 10 }, true],
    [{ op: 'lessThanOrEqual', field: 'x', value: 10 }, { x: 11 }, false],
  ] satisfies [Condition, Record<string, unknown>, boolean][])(
    'evaluates %o',
    (input, answers, expected) => {
      expect(condition(input, answers)).toBe(expected);
    },
  );

  it('evaluates and, or and not', () => {
    expect(
      condition(
        {
          op: 'and',
          conditions: [
            { op: 'exists', field: 'a' },
            {
              op: 'or',
              conditions: [
                { op: 'equals', field: 'b', value: 2 },
                { op: 'not', condition: { op: 'exists', field: 'c' } },
              ],
            },
          ],
        },
        { a: 'yes', b: 1 },
      ),
    ).toBe(true);
  });

  it('distinguishes null, unanswered, and blank', () => {
    const exists: Condition = { op: 'exists', field: 'x' };
    expect(condition(exists, {})).toBe(false);
    expect(condition(exists, { x: null })).toBe(false);
    expect(condition(exists, { x: '' })).toBe(false);
  });

  it('does not coerce types', () => {
    expect(condition({ op: 'equals', field: 'x', value: 20 }, { x: '20' })).toBe(false);
    expect(condition({ op: 'greaterThanOrEqual', field: 'x', value: 20 }, { x: '21' })).toBe(false);
  });
});

describe('field state', () => {
  const field: FieldDefinition = {
    field_id: 'personal.detail',
    type: 'string',
    label: '詳細',
    required: true,
    visible: true,
    visibility_rule_id: 'VIS-1',
    required_rule_id: 'REQ-1',
  };
  const rules: FormDefinition['rules'] = [
    {
      rule_id: 'VIS-1',
      type: 'visibility',
      condition: { op: 'equals', field: 'personal.status', value: 'ACTIVE' },
    },
    {
      rule_id: 'REQ-1',
      type: 'required',
      condition: { op: 'exists', field: 'personal.status' },
    },
  ];

  it('uses visibility rule over fixed visible value', () => {
    expect(isFieldVisible(field, rules, { 'personal.status': 'INACTIVE' })).toBe(false);
  });

  it('never requires a hidden field', () => {
    expect(isFieldRequired(field, rules, { 'personal.status': 'INACTIVE' })).toBe(false);
  });

  it('excludes hidden fields from submission data', () => {
    const definition = structuredClone(validDefinition);
    definition.sections[0].fields.push(field);
    definition.rules = rules;
    expect(
      buildSubmissionPayload(definition, {
        'personal.status': 'INACTIVE',
        'personal.detail': 'must-not-send',
      }),
    ).toEqual({ 'personal.status': 'INACTIVE' });
  });
});
