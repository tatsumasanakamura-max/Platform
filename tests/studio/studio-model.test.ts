import { describe, expect, it } from 'vitest';
import definitionJson from '../../src/definitions/virtual-bank-basic.json';
import type { FormDefinition } from '../../src/domain/form-definition';
import { validateFormDefinition } from '../../src/domain/validate-definition';
import {
  addField,
  deleteField,
  duplicateField,
  findField,
  getFieldGroup,
  moveField,
  moveFieldToSection,
  setFieldGroup,
  setSimpleCondition,
  updateField,
} from '../../src/features/form-studio/studio-model';
import {
  generateChangeManifest,
  generateFieldCatalog,
  generateOpenQuestions,
  generateValidationCatalog,
} from '../../src/features/form-studio/studio-export';
import {
  loadDraft,
  saveDraft,
  STUDIO_STORAGE_KEY,
} from '../../src/features/form-studio/studio-storage';
import { validateStudioDefinition } from '../../src/features/form-studio/studio-validation';

const base = definitionJson as FormDefinition;

describe('form studio editing model', () => {
  it('adds and duplicates fields with unique ids', () => {
    const added = addField(base, 'personal', 'email');
    expect(findField(added.definition, added.fieldId)?.ui_type).toBe('email');
    const copied = duplicateField(added.definition, added.fieldId);
    expect(copied.fieldId).not.toBe(added.fieldId);
    expect(findField(copied.definition, copied.fieldId)?.label).toContain('複製');
  });

  it('deletes a field and its group/scenario references', () => {
    const next = deleteField(base, 'personal.email');
    expect(findField(next, 'personal.email')).toBeUndefined();
    expect(next.sections[0].groups?.[0].field_ids).not.toContain('personal.email');
    expect(next.scenarios?.[0].expected?.visible_field_ids).not.toContain('personal.email');
  });

  it('removes dependent rules when their source field is deleted', () => {
    const conditional = setSimpleCondition(base, 'personal.email', 'visibility', {
      field: 'personal.full_name',
      op: 'exists',
    });
    const ruleId = findField(conditional, 'personal.email')?.visibility_rule_id;
    const next = deleteField(conditional, 'personal.full_name');
    expect(findField(next, 'personal.email')?.visibility_rule_id).toBeUndefined();
    expect(next.rules.some((rule) => rule.rule_id === ruleId)).toBe(false);
    expect(validateStudioDefinition(next).filter((issue) => issue.severity === 'error')).toEqual(
      [],
    );
  });

  it('moves fields up, down, and to another section', () => {
    const down = moveField(base, 'personal.full_name', 1);
    expect(down.sections[0].fields[1].field_id).toBe('personal.full_name');
    const up = moveField(down, 'personal.full_name', -1);
    expect(up.sections[0].fields[0].field_id).toBe('personal.full_name');
    const moved = moveFieldToSection(base, 'personal.full_name', 'confirmation');
    expect(
      moved.sections.find((section) => section.section_id === 'confirmation')?.fields[0].field_id,
    ).toBe('personal.full_name');
  });

  it('sets one structural group without using condition rules', () => {
    const grouped = setFieldGroup(base, 'personal.full_name', 'personal.identity');
    expect(getFieldGroup(grouped, 'personal.full_name')).toBe('personal.identity');
    expect(grouped.rules).toEqual(base.rules);
  });

  it('updates draft attributes without mutating the baseline', () => {
    const next = updateField(base, 'personal.full_name', { placeholder: '合成氏名' });
    expect(findField(next, 'personal.full_name')?.placeholder).toBe('合成氏名');
    expect(findField(base, 'personal.full_name')?.placeholder).not.toBe('合成氏名');
  });

  it('creates and removes minimal visibility and required rules', () => {
    const visible = setSimpleCondition(base, 'personal.email', 'visibility', {
      field: 'personal.housing_type',
      op: 'equals',
      value: 'RENTAL',
    });
    const field = findField(visible, 'personal.email');
    expect(visible.rules.find((rule) => rule.rule_id === field?.visibility_rule_id)?.type).toBe(
      'visibility',
    );
    const required = setSimpleCondition(visible, 'personal.email', 'required', {
      field: 'personal.housing_type',
      op: 'in',
      value: ['OWN', 'RENTAL'],
    });
    expect(findField(required, 'personal.email')?.required_rule_id).toBeTruthy();
    const removed = setSimpleCondition(required, 'personal.email', 'visibility', null);
    expect(findField(removed, 'personal.email')?.visibility_rule_id).toBeUndefined();
  });
});

describe('studio validation, diff, catalogs, and storage', () => {
  it('generates field-level readable changes instead of array replacement', () => {
    const current = updateField(base, 'personal.email', {
      help_text: '代表の合成メールを入力してください',
    });
    const manifest = generateChangeManifest(base, current);
    expect(manifest.changes).toContainEqual(
      expect.objectContaining({
        target_id: 'personal.email',
        property: 'help_text',
        after: '代表の合成メールを入力してください',
      }),
    );
  });

  it('generates required markdown columns and validator messages', () => {
    expect(generateFieldCatalog(base)).toContain(
      '| 項目ID | セクション | ラベル | 型 | 必須 | 表示条件 | ヘルプ |',
    );
    const validation = generateValidationCatalog(base);
    expect(validation).toContain('| 項目ID | validator | 設定値 | error_code | メッセージ |');
    expect(validation).toContain('POSTAL_CODE_INVALID');
    expect(
      generateOpenQuestions(base, [{ severity: 'warning', code: 'CHECK', message: '確認事項' }]),
    ).toContain('[CHECK] 確認事項');
  });

  it('reports duplicate ids, broken references, and self dependencies', () => {
    const duplicate = structuredClone(base);
    duplicate.sections[0].fields.push(structuredClone(duplicate.sections[0].fields[0]));
    expect(
      validateStudioDefinition(duplicate).some((issue) => issue.code === 'DUPLICATE_FIELD_ID'),
    ).toBe(true);
    const self = setSimpleCondition(base, 'personal.email', 'visibility', {
      field: 'personal.email',
      op: 'exists',
    });
    expect(validateStudioDefinition(self).some((issue) => issue.code === 'SELF_DEPENDENCY')).toBe(
      true,
    );
  });

  it('keeps JSON Schema validation as the import gate', () => {
    const invalid = structuredClone(base) as unknown as {
      sections: { fields: { ui_type: string }[] }[];
    };
    invalid.sections[0].fields[0].ui_type = 'script';
    expect(validateFormDefinition(invalid).length).toBeGreaterThan(0);
  });

  it('round-trips valid drafts and rejects invalid local storage', () => {
    const map = new Map<string, string>();
    const storage = {
      setItem: (key: string, value: string) => map.set(key, value),
      getItem: (key: string) => map.get(key) ?? null,
    };
    saveDraft(storage, base);
    expect(loadDraft(storage)?.form_version).toBe(base.form_version);
    map.set(STUDIO_STORAGE_KEY, '{invalid');
    expect(loadDraft(storage)).toBeNull();
  });
});
