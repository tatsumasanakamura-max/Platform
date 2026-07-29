import type { Answers } from './answers';
import type { FormDefinition } from './form-definition';
import { evaluateCondition } from './rule-engine';

export function resolveNextSection(
  definition: FormDefinition,
  fromSectionId: string,
  answers: Answers,
): string | null {
  const navigation = definition.navigation.find((entry) => entry.from_section_id === fromSectionId);
  if (!navigation) throw new Error(`Navigation is not defined for ${fromSectionId}`);
  if (navigation.terminal) return null;

  const matched = (navigation.navigation_rule_ids ?? [])
    .map((ruleId) => definition.rules.find((rule) => rule.rule_id === ruleId))
    .filter(
      (rule): rule is NonNullable<typeof rule> =>
        rule?.type === 'navigation' && evaluateCondition(rule.condition, answers),
    );

  if (matched.length > 1) {
    throw new Error(`Multiple navigation rules matched for ${fromSectionId}`);
  }

  return matched[0]?.result?.next_section_id ?? navigation.default_next_section_id ?? null;
}
