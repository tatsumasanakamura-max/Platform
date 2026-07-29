import type { Condition, FieldDefinition, RuleDefinition, ScalarValue } from './form-definition';
import type { Answers } from './answers';

function isScalar(value: unknown): value is ScalarValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

function strictlyComparable(left: unknown, right: unknown): boolean {
  return typeof left === typeof right && (typeof left === 'number' || typeof left === 'string');
}

export function evaluateCondition(condition: Condition, answers: Answers): boolean {
  if (condition.op === 'and') {
    return condition.conditions.every((child) => evaluateCondition(child, answers));
  }
  if (condition.op === 'or') {
    return condition.conditions.some((child) => evaluateCondition(child, answers));
  }
  if (condition.op === 'not') {
    return !evaluateCondition(condition.condition, answers);
  }

  if (!('field' in condition)) return false;
  const answer = answers[condition.field];
  switch (condition.op) {
    case 'exists':
      return answer !== undefined && answer !== null && answer !== '';
    case 'equals':
      return isScalar(condition.value) && answer === condition.value;
    case 'notEquals':
      return isScalar(condition.value) && answer !== condition.value;
    case 'in':
      return (
        Array.isArray(condition.value) &&
        condition.value.some((candidate) => isScalar(candidate) && candidate === answer)
      );
    case 'greaterThanOrEqual':
      return (
        isScalar(condition.value) &&
        strictlyComparable(answer, condition.value) &&
        (answer as number | string) >= (condition.value as number | string)
      );
    case 'lessThanOrEqual':
      return (
        isScalar(condition.value) &&
        strictlyComparable(answer, condition.value) &&
        (answer as number | string) <= (condition.value as number | string)
      );
  }
}

function findRule(
  ruleId: string | undefined,
  expectedType: RuleDefinition['type'],
  rules: RuleDefinition[],
): RuleDefinition | undefined {
  if (!ruleId) return undefined;
  const rule = rules.find((candidate) => candidate.rule_id === ruleId);
  return rule?.type === expectedType ? rule : undefined;
}

export function isFieldVisible(
  field: FieldDefinition,
  rules: RuleDefinition[],
  answers: Answers,
): boolean {
  const rule = findRule(field.visibility_rule_id, 'visibility', rules);
  if (!rule) return field.visible ?? true;
  return evaluateCondition(rule.condition, answers);
}

export function isFieldRequired(
  field: FieldDefinition,
  rules: RuleDefinition[],
  answers: Answers,
): boolean {
  if (!isFieldVisible(field, rules, answers)) return false;
  const rule = findRule(field.required_rule_id, 'required', rules);
  if (!rule) return field.required;
  return evaluateCondition(rule.condition, answers);
}

export function evaluateValidationRules(
  field: FieldDefinition,
  rules: RuleDefinition[],
  answers: Answers,
): string[] {
  return (field.validation_rule_ids ?? []).flatMap((ruleId) => {
    const rule = findRule(ruleId, 'validation', rules);
    if (!rule || evaluateCondition(rule.condition, answers)) return [];
    return rule.result?.error_code ? [rule.result.error_code] : [];
  });
}
