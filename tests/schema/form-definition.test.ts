import { describe, expect, it } from 'vitest';
import definition from '../../src/definitions/virtual-bank-basic.json';
import { validateFormDefinition } from '../../src/domain/validate-definition';
import { validDefinition } from '../fixtures/valid-definition';

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe('form definition validation', () => {
  it('accepts the bundled definition', () => {
    expect(validateFormDefinition(definition)).toEqual([]);
  });

  it('rejects missing required properties', () => {
    const invalid = clone(validDefinition) as unknown as Record<string, unknown>;
    delete invalid.bank_id;
    expect(validateFormDefinition(invalid).some((issue) => issue.code === 'SCHEMA_REQUIRED')).toBe(
      true,
    );
  });

  it('rejects an invalid field type', () => {
    const invalid = clone(validDefinition) as unknown as {
      sections: { fields: { type: string }[] }[];
    };
    invalid.sections[0].fields[0].type = 'money';
    expect(validateFormDefinition(invalid).length).toBeGreaterThan(0);
  });

  it('finds duplicate field ids', () => {
    const invalid = clone(validDefinition);
    invalid.sections[0].fields.push(clone(invalid.sections[0].fields[0]));
    expect(validateFormDefinition(invalid)).toContainEqual(
      expect.objectContaining({ code: 'DUPLICATE_FIELD_ID' }),
    );
  });

  it('finds missing rule references', () => {
    const invalid = clone(validDefinition);
    invalid.sections[0].fields[0].visibility_rule_id = 'VIS-MISSING';
    expect(validateFormDefinition(invalid)).toContainEqual(
      expect.objectContaining({ code: 'INVALID_RULE_REFERENCE' }),
    );
  });

  it('rejects unapproved operators', () => {
    const invalid = clone(validDefinition) as unknown as Record<string, unknown>;
    invalid.rules = [
      {
        rule_id: 'RULE-1',
        type: 'visibility',
        condition: { op: 'matches', field: 'personal.status', value: '.*' },
      },
    ];
    expect(validateFormDefinition(invalid).length).toBeGreaterThan(0);
  });

  it('rejects unapproved validators and arbitrary regular expressions', () => {
    const invalid = clone(validDefinition) as unknown as {
      sections: { fields: { validators: unknown[] }[] }[];
    };
    invalid.sections[0].fields[0].validators = [
      { type: 'regex', value: '.*', error_code: 'UNSAFE' },
    ];
    expect(validateFormDefinition(invalid).length).toBeGreaterThan(0);
  });

  it('finds invalid navigation targets', () => {
    const invalid = clone(validDefinition);
    invalid.navigation[0].default_next_section_id = 'missing';
    expect(validateFormDefinition(invalid)).toContainEqual(
      expect.objectContaining({ code: 'UNKNOWN_NAVIGATION_TARGET' }),
    );
  });
  it('finds unreachable sections', () => {
    const invalid = clone(validDefinition);
    invalid.sections.push({ section_id: 'orphan', label: '孤立', fields: [] });
    invalid.navigation.push({ from_section_id: 'orphan', terminal: true });
    expect(validateFormDefinition(invalid)).toContainEqual(
      expect.objectContaining({ code: 'UNREACHABLE_SECTION' }),
    );
  });

  it('finds navigation cycles', () => {
    const invalid = clone(validDefinition);
    invalid.navigation[1] = {
      from_section_id: 'complete',
      default_next_section_id: 'personal',
    };
    expect(validateFormDefinition(invalid)).toContainEqual(
      expect.objectContaining({ code: 'NAVIGATION_CYCLE' }),
    );
  });
});
