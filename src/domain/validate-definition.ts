import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import schema from '../../schema/form-definition.schema.json';
import type { Condition, FormDefinition } from './form-definition';
import { validateNavigationGraph } from './validate-navigation';

const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
const validateSchema = ajv.compile<FormDefinition>(schema);

export interface DefinitionIssue {
  code: string;
  path: string;
  message: string;
}

function schemaIssue(error: ErrorObject): DefinitionIssue {
  return {
    code: `SCHEMA_${error.keyword.toUpperCase()}`,
    path: error.instancePath || '/',
    message: error.message ?? 'Form definition does not match the schema',
  };
}

function visitCondition(condition: Condition, visitField: (fieldId: string) => void): void {
  if (condition.op === 'and' || condition.op === 'or') {
    condition.conditions.forEach((child) => visitCondition(child, visitField));
  } else if (condition.op === 'not') {
    visitCondition(condition.condition, visitField);
  } else if ('field' in condition) {
    visitField(condition.field);
  }
}

function duplicates(values: string[]): string[] {
  return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
}

export function validateFormDefinition(input: unknown): DefinitionIssue[] {
  if (!validateSchema(input)) return (validateSchema.errors ?? []).map(schemaIssue);

  const definition = input;
  const issues: DefinitionIssue[] = [];
  const sectionIds = definition.sections.map((section) => section.section_id);
  const fieldIds = definition.sections.flatMap((section) =>
    section.fields.map((field) => field.field_id),
  );
  const ruleIds = definition.rules.map((rule) => rule.rule_id);

  duplicates(sectionIds).forEach((id) =>
    issues.push({ code: 'DUPLICATE_SECTION_ID', path: '/sections', message: id }),
  );
  duplicates(fieldIds).forEach((id) =>
    issues.push({ code: 'DUPLICATE_FIELD_ID', path: '/sections/*/fields', message: id }),
  );
  duplicates(ruleIds).forEach((id) =>
    issues.push({ code: 'DUPLICATE_RULE_ID', path: '/rules', message: id }),
  );

  for (const section of definition.sections) {
    for (const field of section.fields) {
      for (const [reference, expectedType] of [
        [field.visibility_rule_id, 'visibility'],
        [field.required_rule_id, 'required'],
        ...(field.validation_rule_ids ?? []).map((id) => [id, 'validation']),
      ] as [string | undefined, string][]) {
        if (!reference) continue;
        const rule = definition.rules.find((candidate) => candidate.rule_id === reference);
        if (!rule || rule.type !== expectedType) {
          issues.push({
            code: 'INVALID_RULE_REFERENCE',
            path: `/fields/${field.field_id}`,
            message: `${reference} must reference a ${expectedType} rule`,
          });
        }
      }
    }
  }

  for (const rule of definition.rules) {
    visitCondition(rule.condition, (fieldId) => {
      if (!fieldIds.includes(fieldId)) {
        issues.push({
          code: 'UNKNOWN_FIELD_REFERENCE',
          path: `/rules/${rule.rule_id}`,
          message: fieldId,
        });
      }
    });
    if (
      rule.type === 'navigation' &&
      (!rule.result?.next_section_id || !sectionIds.includes(rule.result.next_section_id))
    ) {
      issues.push({
        code: 'UNKNOWN_NAVIGATION_TARGET',
        path: `/rules/${rule.rule_id}`,
        message: rule.result?.next_section_id ?? 'missing next_section_id',
      });
    }
  }

  for (const navigation of definition.navigation) {
    if (!sectionIds.includes(navigation.from_section_id)) {
      issues.push({
        code: 'UNKNOWN_NAVIGATION_SOURCE',
        path: '/navigation',
        message: navigation.from_section_id,
      });
    }
    if (
      navigation.default_next_section_id &&
      !sectionIds.includes(navigation.default_next_section_id)
    ) {
      issues.push({
        code: 'UNKNOWN_NAVIGATION_TARGET',
        path: '/navigation',
        message: navigation.default_next_section_id,
      });
    }
    for (const ruleId of navigation.navigation_rule_ids ?? []) {
      const rule = definition.rules.find((candidate) => candidate.rule_id === ruleId);
      if (!rule || rule.type !== 'navigation') {
        issues.push({
          code: 'INVALID_NAVIGATION_RULE_REFERENCE',
          path: '/navigation',
          message: ruleId,
        });
      }
    }
    if (!navigation.terminal && !navigation.default_next_section_id) {
      issues.push({
        code: 'MISSING_DEFAULT_OR_TERMINAL',
        path: '/navigation',
        message: navigation.from_section_id,
      });
    }
  }

  issues.push(...validateNavigationGraph(definition));
  return issues;
}
