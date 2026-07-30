import type { FieldDefinition, FormDefinition, RuleDefinition } from '../../domain/form-definition';
import type { StudioIssue } from './studio-validation';
import { getFieldGroup } from './studio-model';

export interface ChangeEntry {
  target_id: string;
  property: string;
  before: unknown;
  after: unknown;
}

export interface ChangeManifest {
  change_id: 'LOCAL-DRAFT';
  base_form_version: string;
  target_form_version: string;
  summary: string;
  changes: ChangeEntry[];
}

function ruleFor(
  definition: FormDefinition,
  ruleId: string | undefined,
): RuleDefinition | undefined {
  return definition.rules.find((rule) => rule.rule_id === ruleId);
}

function fieldSnapshot(definition: FormDefinition, field: FieldDefinition) {
  const section = definition.sections.find((candidate) =>
    candidate.fields.some((item) => item.field_id === field.field_id),
  );
  const order = section?.fields.findIndex((item) => item.field_id === field.field_id) ?? -1;
  return {
    section_id: section?.section_id,
    group_id: getFieldGroup(definition, field.field_id) || undefined,
    order,
    type: field.type,
    ui_type: field.ui_type,
    label: field.label,
    placeholder: field.placeholder,
    example: field.example,
    help_text: field.help_text,
    description: field.description,
    required: field.required,
    options: field.options,
    validators: field.validators,
    visibility_condition: ruleFor(definition, field.visibility_rule_id)?.condition,
    required_condition: ruleFor(definition, field.required_rule_id)?.condition,
  };
}

export function generateChangeManifest(
  baseline: FormDefinition,
  current: FormDefinition,
): ChangeManifest {
  const beforeFields = new Map(
    baseline.sections.flatMap((section) => section.fields).map((field) => [field.field_id, field]),
  );
  const afterFields = new Map(
    current.sections.flatMap((section) => section.fields).map((field) => [field.field_id, field]),
  );
  const changes: ChangeEntry[] = [];
  const ids = new Set([...beforeFields.keys(), ...afterFields.keys()]);

  for (const id of ids) {
    const before = beforeFields.get(id);
    const after = afterFields.get(id);
    if (!before) {
      changes.push({
        target_id: id,
        property: '$field',
        before: null,
        after: fieldSnapshot(current, after!),
      });
      continue;
    }
    if (!after) {
      changes.push({
        target_id: id,
        property: '$field',
        before: fieldSnapshot(baseline, before),
        after: null,
      });
      continue;
    }
    const beforeSnapshot = fieldSnapshot(baseline, before);
    const afterSnapshot = fieldSnapshot(current, after);
    for (const property of Object.keys(afterSnapshot) as (keyof typeof afterSnapshot)[]) {
      const left = beforeSnapshot[property];
      const right = afterSnapshot[property];
      if (JSON.stringify(left) !== JSON.stringify(right)) {
        changes.push({ target_id: id, property, before: left ?? null, after: right ?? null });
      }
    }
  }

  return {
    change_id: 'LOCAL-DRAFT',
    base_form_version: baseline.form_version,
    target_form_version: current.form_version,
    summary: '画面設定から生成された変更',
    changes,
  };
}

function cell(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  return String(value).replaceAll('|', '\\|').replaceAll('\n', '<br>');
}

function conditionText(definition: FormDefinition, field: FieldDefinition): string {
  const condition = ruleFor(definition, field.visibility_rule_id)?.condition;
  return condition ? `\`${JSON.stringify(condition)}\`` : '常に表示';
}

export function generateFieldCatalog(definition: FormDefinition): string {
  const rows = definition.sections.flatMap((section) =>
    section.fields.map(
      (field) =>
        `| ${cell(field.field_id)} | ${cell(section.label)} | ${cell(field.label)} | ${cell(field.ui_type ?? field.type)} | ${field.required ? '必須' : '任意'} | ${conditionText(definition, field)} | ${cell(field.help_text ?? field.description)} |`,
    ),
  );
  return `# 項目定義書\n\n生成元: FormDefinition ${definition.form_version}\n\n| 項目ID | セクション | ラベル | 型 | 必須 | 表示条件 | ヘルプ |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
}

export function generateValidationCatalog(definition: FormDefinition): string {
  const rows = definition.sections.flatMap((section) =>
    section.fields.flatMap((field) =>
      (field.validators ?? []).map(
        (validator) =>
          `| ${cell(field.field_id)} | ${cell(validator.type)} | ${cell(validator.value)} | ${cell(validator.error_code)} | ${cell(validator.message)} |`,
      ),
    ),
  );
  return `# バリデーション一覧\n\n生成元: FormDefinition ${definition.form_version}\n\n| 項目ID | validator | 設定値 | error_code | メッセージ |\n|---|---|---|---|---|\n${rows.join('\n') || '| — | — | — | — | — |'}\n`;
}

export function generateRuleCatalog(definition: FormDefinition): string {
  const rows = definition.rules.map(
    (rule) =>
      `| ${cell(rule.rule_id)} | ${cell(rule.type)} | \`${JSON.stringify(rule.condition)}\` |`,
  );
  return `# 条件分岐一覧\n\n| rule_id | 種別 | 条件 |\n|---|---|---|\n${rows.join('\n') || '| — | — | — |'}\n`;
}

export function generateOpenQuestions(definition: FormDefinition, issues: StudioIssue[]): string {
  const manual = definition.open_questions ?? [];
  const warnings = issues
    .filter((issue) => issue.severity === 'warning')
    .map((issue) => `[${issue.code}] ${issue.message}`);
  const questions = [...manual, ...warnings];
  return `# 未解決事項\n\n${questions.map((question) => `- [ ] ${question}`).join('\n') || '- なし'}\n`;
}
