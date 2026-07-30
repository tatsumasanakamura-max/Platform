import type {
  Condition,
  FieldControlType,
  FieldDefinition,
  FormDefinition,
  RuleDefinition,
  ScalarValue,
} from '../../domain/form-definition';

export type SimpleConditionOperator = 'equals' | 'notEquals' | 'in' | 'exists';

export interface SimpleConditionInput {
  field: string;
  op: SimpleConditionOperator;
  value?: ScalarValue | ScalarValue[];
}

export function cloneDefinition(definition: FormDefinition): FormDefinition {
  return structuredClone(definition);
}

function coordinates(definition: FormDefinition, fieldId: string) {
  for (let sectionIndex = 0; sectionIndex < definition.sections.length; sectionIndex += 1) {
    const fieldIndex = definition.sections[sectionIndex].fields.findIndex(
      (field) => field.field_id === fieldId,
    );
    if (fieldIndex >= 0) return { sectionIndex, fieldIndex };
  }
  return undefined;
}

export function findField(
  definition: FormDefinition,
  fieldId: string,
): FieldDefinition | undefined {
  const found = coordinates(definition, fieldId);
  return found ? definition.sections[found.sectionIndex].fields[found.fieldIndex] : undefined;
}

function uniqueFieldId(definition: FormDefinition, sectionId: string, stem = 'field'): string {
  const ids = new Set(
    definition.sections.flatMap((section) => section.fields.map((field) => field.field_id)),
  );
  let index = 1;
  let candidate = `${sectionId}.${stem}_${index}`;
  while (ids.has(candidate)) {
    index += 1;
    candidate = `${sectionId}.${stem}_${index}`;
  }
  return candidate;
}

function fieldTypeFor(control: FieldControlType): FieldDefinition['type'] {
  if (control === 'number') return 'integer';
  if (control === 'date') return 'date';
  if (control === 'radio' || control === 'select') return 'enum';
  if (control === 'checkbox') return 'boolean';
  return 'string';
}

export function addField(
  definition: FormDefinition,
  sectionId: string,
  control: FieldControlType = 'text',
): { definition: FormDefinition; fieldId: string } {
  const next = cloneDefinition(definition);
  const section = next.sections.find((candidate) => candidate.section_id === sectionId);
  if (!section) return { definition, fieldId: '' };
  const fieldId = uniqueFieldId(next, sectionId);
  section.fields.push({
    field_id: fieldId,
    type: fieldTypeFor(control),
    ui_type: control,
    label: '新しい項目',
    required: false,
    visible: true,
    validators: [],
    validation_timing: ['onSectionNext', 'onSubmit'],
    ...(control === 'radio' || control === 'select'
      ? { options: [{ value: 'OPTION_1', label: '選択肢1' }] }
      : {}),
  });
  return { definition: next, fieldId };
}

function uniqueCopyId(definition: FormDefinition, sourceId: string): string {
  const ids = new Set(
    definition.sections.flatMap((section) => section.fields.map((field) => field.field_id)),
  );
  let candidate = `${sourceId}_copy`;
  let index = 2;
  while (ids.has(candidate)) {
    candidate = `${sourceId}_copy${index}`;
    index += 1;
  }
  return candidate;
}

export function duplicateField(
  definition: FormDefinition,
  fieldId: string,
): { definition: FormDefinition; fieldId: string } {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  if (!found) return { definition, fieldId: '' };
  const source = next.sections[found.sectionIndex].fields[found.fieldIndex];
  const copyId = uniqueCopyId(next, source.field_id);
  const copy = { ...structuredClone(source), field_id: copyId, label: `${source.label}（複製）` };
  next.sections[found.sectionIndex].fields.splice(found.fieldIndex + 1, 0, copy);
  return { definition: next, fieldId: copyId };
}

function ruleIsReferenced(definition: FormDefinition, ruleId: string): boolean {
  return definition.sections.some((section) =>
    section.fields.some(
      (field) =>
        field.visibility_rule_id === ruleId ||
        field.required_rule_id === ruleId ||
        field.validation_rule_ids?.includes(ruleId),
    ),
  );
}

function conditionUsesField(condition: Condition, fieldId: string): boolean {
  if (condition.op === 'and' || condition.op === 'or')
    return condition.conditions.some((child) => conditionUsesField(child, fieldId));
  if (condition.op === 'not') return conditionUsesField(condition.condition, fieldId);
  return 'field' in condition && condition.field === fieldId;
}

export function deleteField(definition: FormDefinition, fieldId: string): FormDefinition {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  if (!found) return definition;
  const [removed] = next.sections[found.sectionIndex].fields.splice(found.fieldIndex, 1);
  for (const section of next.sections) {
    for (const group of section.groups ?? []) {
      group.field_ids = group.field_ids.filter((id) => id !== fieldId);
    }
    section.groups = section.groups?.filter((group) => group.field_ids.length > 0);
  }
  for (const scenario of next.scenarios ?? []) {
    delete scenario.answers[fieldId];
    if (scenario.expected?.visible_field_ids) {
      scenario.expected.visible_field_ids = scenario.expected.visible_field_ids.filter(
        (id) => id !== fieldId,
      );
    }
  }
  const candidateRules = [
    removed.visibility_rule_id,
    removed.required_rule_id,
    ...(removed.validation_rule_ids ?? []),
  ].filter((value): value is string => Boolean(value));
  next.rules = next.rules.filter(
    (rule) => !candidateRules.includes(rule.rule_id) || ruleIsReferenced(next, rule.rule_id),
  );

  const dependentRuleIds = new Set(
    next.rules
      .filter((rule) => conditionUsesField(rule.condition, fieldId))
      .map((rule) => rule.rule_id),
  );
  if (dependentRuleIds.size > 0) {
    next.rules = next.rules.filter((rule) => !dependentRuleIds.has(rule.rule_id));
    for (const section of next.sections) {
      for (const field of section.fields) {
        if (field.visibility_rule_id && dependentRuleIds.has(field.visibility_rule_id))
          delete field.visibility_rule_id;
        if (field.required_rule_id && dependentRuleIds.has(field.required_rule_id))
          delete field.required_rule_id;
        if (field.validation_rule_ids)
          field.validation_rule_ids = field.validation_rule_ids.filter(
            (ruleId) => !dependentRuleIds.has(ruleId),
          );
      }
    }
    for (const navigation of next.navigation) {
      if (navigation.navigation_rule_ids)
        navigation.navigation_rule_ids = navigation.navigation_rule_ids.filter(
          (ruleId) => !dependentRuleIds.has(ruleId),
        );
    }
  }
  return next;
}

export function moveField(
  definition: FormDefinition,
  fieldId: string,
  direction: -1 | 1,
): FormDefinition {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  if (!found) return definition;
  const fields = next.sections[found.sectionIndex].fields;
  const target = found.fieldIndex + direction;
  if (target < 0 || target >= fields.length) return definition;
  [fields[found.fieldIndex], fields[target]] = [fields[target], fields[found.fieldIndex]];
  return next;
}

export function moveFieldToSection(
  definition: FormDefinition,
  fieldId: string,
  sectionId: string,
): FormDefinition {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  const target = next.sections.find((section) => section.section_id === sectionId);
  if (!found || !target) return definition;
  const [field] = next.sections[found.sectionIndex].fields.splice(found.fieldIndex, 1);
  for (const section of next.sections) {
    for (const group of section.groups ?? [])
      group.field_ids = group.field_ids.filter((id) => id !== fieldId);
    section.groups = section.groups?.filter((group) => group.field_ids.length > 0);
  }
  target.fields.push(field);
  return next;
}

export function renameField(
  definition: FormDefinition,
  fieldId: string,
  nextFieldId: string,
): FormDefinition {
  if (!nextFieldId.trim() || (fieldId !== nextFieldId && findField(definition, nextFieldId)))
    return definition;
  const next = cloneDefinition(definition);
  const field = findField(next, fieldId);
  if (!field) return definition;
  const replacement = nextFieldId.trim();
  field.field_id = replacement;
  const visit = (condition: Condition): void => {
    if (condition.op === 'and' || condition.op === 'or') condition.conditions.forEach(visit);
    else if (condition.op === 'not') visit(condition.condition);
    else if ('field' in condition && condition.field === fieldId) condition.field = replacement;
  };
  next.rules.forEach((rule) => visit(rule.condition));
  for (const section of next.sections) {
    for (const group of section.groups ?? []) {
      group.field_ids = group.field_ids.map((id) => (id === fieldId ? replacement : id));
    }
  }
  for (const scenario of next.scenarios ?? []) {
    if (Object.hasOwn(scenario.answers, fieldId)) {
      scenario.answers[replacement] = scenario.answers[fieldId];
      delete scenario.answers[fieldId];
    }
    if (scenario.expected?.visible_field_ids) {
      scenario.expected.visible_field_ids = scenario.expected.visible_field_ids.map((id) =>
        id === fieldId ? replacement : id,
      );
    }
  }
  return next;
}
export function updateField(
  definition: FormDefinition,
  fieldId: string,
  update: Partial<FieldDefinition>,
): FormDefinition {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  if (!found) return definition;
  next.sections[found.sectionIndex].fields[found.fieldIndex] = {
    ...next.sections[found.sectionIndex].fields[found.fieldIndex],
    ...update,
  };
  return next;
}

export function getFieldGroup(definition: FormDefinition, fieldId: string): string {
  for (const section of definition.sections) {
    const group = section.groups?.find((candidate) => candidate.field_ids.includes(fieldId));
    if (group) return group.group_id;
  }
  return '';
}

export function setFieldGroup(
  definition: FormDefinition,
  fieldId: string,
  groupId: string,
): FormDefinition {
  const next = cloneDefinition(definition);
  const found = coordinates(next, fieldId);
  if (!found) return definition;
  const section = next.sections[found.sectionIndex];
  for (const candidate of section.groups ?? []) {
    candidate.field_ids = candidate.field_ids.filter((id) => id !== fieldId);
  }
  section.groups = section.groups?.filter((group) => group.field_ids.length > 0);
  if (groupId.trim()) {
    const normalized = groupId.trim();
    const group = section.groups?.find((candidate) => candidate.group_id === normalized);
    if (group) group.field_ids.push(fieldId);
    else {
      section.groups = [
        ...(section.groups ?? []),
        { group_id: normalized, label: normalized, field_ids: [fieldId] },
      ];
    }
  }
  return next;
}

export function isSimpleCondition(
  condition: Condition,
): condition is Extract<Condition, { field: string }> {
  return 'field' in condition && ['equals', 'notEquals', 'in', 'exists'].includes(condition.op);
}

function uniqueRuleId(definition: FormDefinition, prefix: string, fieldId: string): string {
  const stem = `${prefix}-${fieldId.replace(/[^A-Za-z0-9]+/gu, '-').toUpperCase()}`;
  const ids = new Set(definition.rules.map((rule) => rule.rule_id));
  let candidate = stem;
  let index = 2;
  while (ids.has(candidate)) {
    candidate = `${stem}-${index}`;
    index += 1;
  }
  return candidate;
}

export function setSimpleCondition(
  definition: FormDefinition,
  fieldId: string,
  type: 'visibility' | 'required',
  input: SimpleConditionInput | null,
): FormDefinition {
  const next = cloneDefinition(definition);
  const field = findField(next, fieldId);
  if (!field) return definition;
  const property = type === 'visibility' ? 'visibility_rule_id' : 'required_rule_id';
  const existingId = field[property];
  const existing = next.rules.find((rule) => rule.rule_id === existingId && rule.type === type);

  if (!input) {
    delete field[property];
    if (existingId && !ruleIsReferenced(next, existingId)) {
      next.rules = next.rules.filter((rule) => rule.rule_id !== existingId);
    }
    return next;
  }

  const condition: Condition =
    input.op === 'exists'
      ? { op: 'exists', field: input.field }
      : { op: input.op, field: input.field, value: input.value };
  if (existing && isSimpleCondition(existing.condition)) existing.condition = condition;
  else {
    const ruleId = uniqueRuleId(next, type === 'visibility' ? 'VIS' : 'REQ', fieldId);
    const rule: RuleDefinition = { rule_id: ruleId, type, condition };
    next.rules.push(rule);
    field[property] = ruleId;
  }
  return next;
}
