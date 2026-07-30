import type { Condition, FormDefinition } from '../../domain/form-definition';
import { validateFormDefinition } from '../../domain/validate-definition';
import { findField, getFieldGroup, isSimpleCondition } from './studio-model';

export interface StudioIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
  targetId?: string;
}

function conditionField(condition: Condition): string[] {
  if (condition.op === 'and' || condition.op === 'or')
    return condition.conditions.flatMap(conditionField);
  if (condition.op === 'not') return conditionField(condition.condition);
  return 'field' in condition ? [condition.field] : [];
}

function targetFromPath(path: string, definition: FormDefinition): string | undefined {
  return definition.sections
    .flatMap((section) => section.fields)
    .find((field) => path.includes(field.field_id))?.field_id;
}

export function validateStudioDefinition(input: unknown, baseline?: FormDefinition): StudioIssue[] {
  const core = validateFormDefinition(input);
  if (core.length > 0) {
    const candidate = input as FormDefinition;
    return core.map((issue) => ({
      severity: 'error',
      code: issue.code,
      message: `${issue.path}: ${issue.message}`,
      targetId: candidate?.sections ? targetFromPath(issue.path, candidate) : undefined,
    }));
  }

  const definition = input as FormDefinition;
  const issues: StudioIssue[] = [];
  const fieldIds = new Set(
    definition.sections.flatMap((section) => section.fields.map((field) => field.field_id)),
  );
  const groupIds: string[] = [];

  for (const section of definition.sections) {
    for (const group of section.groups ?? []) {
      groupIds.push(group.group_id);
      for (const fieldId of group.field_ids) {
        if (!section.fields.some((field) => field.field_id === fieldId)) {
          issues.push({
            severity: 'error',
            code: 'INVALID_GROUP_REFERENCE',
            message: `${group.label}が存在しない項目 ${fieldId} を参照しています`,
            targetId: fieldId,
          });
        }
      }
    }
    for (const field of section.fields) {
      if (field.label.length > 30)
        issues.push({
          severity: 'warning',
          code: 'LONG_LABEL',
          message: `${field.label}: ラベルが30文字を超えています`,
          targetId: field.field_id,
        });
      if (!field.help_text && !field.description)
        issues.push({
          severity: 'warning',
          code: 'MISSING_HELP',
          message: `${field.label}: ヘルプ文言がありません`,
          targetId: field.field_id,
        });
      if (field.placeholder && field.placeholder === field.label)
        issues.push({
          severity: 'warning',
          code: 'PLACEHOLDER_EQUALS_LABEL',
          message: `${field.label}: プレースホルダーをラベルと同じ文言にしないでください`,
          targetId: field.field_id,
        });
      if (
        (field.ui_type === 'radio' || field.ui_type === 'select' || field.type === 'enum') &&
        (field.options?.length ?? 0) === 1
      ) {
        issues.push({
          severity: 'warning',
          code: 'ONE_OPTION',
          message: `${field.label}: 選択肢が1件だけです`,
          targetId: field.field_id,
        });
      }
      for (const ruleId of [field.visibility_rule_id, field.required_rule_id].filter(
        Boolean,
      ) as string[]) {
        const rule = definition.rules.find((candidate) => candidate.rule_id === ruleId);
        if (!rule) continue;
        if (conditionField(rule.condition).includes(field.field_id))
          issues.push({
            severity: 'error',
            code: 'SELF_DEPENDENCY',
            message: `${field.label}: 自分自身を条件の基準項目にできません`,
            targetId: field.field_id,
          });
        if (!isSimpleCondition(rule.condition))
          issues.push({
            severity: 'warning',
            code: 'READ_ONLY_COMPLEX_CONDITION',
            message: `${field.label}: 複合条件はStudioで読取専用です`,
            targetId: field.field_id,
          });
      }
    }
  }

  const duplicateGroups = groupIds.filter((id, index) => groupIds.indexOf(id) !== index);
  for (const groupId of new Set(duplicateGroups))
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_GROUP_ID',
      message: `重複したgroup_id: ${groupId}`,
    });

  for (const scenario of definition.scenarios ?? []) {
    for (const fieldId of Object.keys(scenario.answers)) {
      if (!fieldIds.has(fieldId))
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_SCENARIO_FIELD',
          message: `${scenario.name}: 回答が存在しない項目 ${fieldId} を参照しています`,
          targetId: fieldId,
        });
    }
    for (const fieldId of scenario.expected?.visible_field_ids ?? []) {
      if (!fieldIds.has(fieldId))
        issues.push({
          severity: 'error',
          code: 'UNKNOWN_EXPECTED_FIELD',
          message: `${scenario.name}: 期待表示が存在しない項目 ${fieldId} を参照しています`,
          targetId: fieldId,
        });
    }
  }

  for (const rule of definition.rules) {
    for (const sourceId of conditionField(rule.condition)) {
      const sourceSection = definition.sections.findIndex((section) =>
        section.fields.some((field) => field.field_id === sourceId),
      );
      const targets = definition.sections
        .flatMap((section) => section.fields)
        .filter(
          (field) =>
            field.visibility_rule_id === rule.rule_id || field.required_rule_id === rule.rule_id,
        );
      for (const target of targets) {
        const targetSection = definition.sections.findIndex((section) =>
          section.fields.some((field) => field.field_id === target.field_id),
        );
        if (sourceSection > targetSection)
          issues.push({
            severity: 'warning',
            code: 'LATER_SECTION_DEPENDENCY',
            message: `${target.label}: 条件参照元が後続セクションにあります`,
            targetId: target.field_id,
          });
      }
    }
  }

  if (
    baseline &&
    baseline.form_version === definition.form_version &&
    JSON.stringify(baseline) !== JSON.stringify(definition)
  ) {
    issues.push({
      severity: 'warning',
      code: 'VERSION_UNCHANGED',
      message: '定義を変更しましたがform_versionがベースラインと同じです',
    });
  }

  return issues;
}

export function issueTargetGroup(definition: FormDefinition, targetId: string | undefined): string {
  return targetId ? getFieldGroup(definition, targetId) : '';
}

export function targetExists(definition: FormDefinition, targetId: string | undefined): boolean {
  return Boolean(targetId && findField(definition, targetId));
}
