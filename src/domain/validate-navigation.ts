import type { FormDefinition } from './form-definition';

export interface NavigationIssue {
  code: string;
  path: string;
  message: string;
}

export function validateNavigationGraph(definition: FormDefinition): NavigationIssue[] {
  const issues: NavigationIssue[] = [];
  const sectionIds = new Set(definition.sections.map((section) => section.section_id));
  const ruleById = new Map(definition.rules.map((rule) => [rule.rule_id, rule]));
  const edges = new Map<string, string[]>();

  for (const navigation of definition.navigation) {
    const targets = [
      navigation.default_next_section_id,
      ...(navigation.navigation_rule_ids ?? []).map(
        (ruleId) => ruleById.get(ruleId)?.result?.next_section_id,
      ),
    ].filter((target): target is string => typeof target === 'string' && sectionIds.has(target));
    edges.set(navigation.from_section_id, targets);

    if ((navigation.navigation_rule_ids?.length ?? 0) > 1) {
      issues.push({
        code: 'POTENTIALLY_AMBIGUOUS_NAVIGATION',
        path: `/navigation/${navigation.from_section_id}`,
        message: 'PoC-1 permits at most one conditional navigation rule per section',
      });
    }
  }

  const firstSection = definition.sections[0]?.section_id;
  const reachable = new Set<string>();
  if (firstSection) {
    const queue = [firstSection];
    while (queue.length > 0) {
      const sectionId = queue.shift();
      if (!sectionId || reachable.has(sectionId)) continue;
      reachable.add(sectionId);
      queue.push(...(edges.get(sectionId) ?? []));
    }
  }

  for (const sectionId of sectionIds) {
    if (!reachable.has(sectionId)) {
      issues.push({
        code: 'UNREACHABLE_SECTION',
        path: `/sections/${sectionId}`,
        message: sectionId,
      });
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  let cycleFound = false;
  function visit(sectionId: string): void {
    if (visiting.has(sectionId)) {
      cycleFound = true;
      return;
    }
    if (visited.has(sectionId)) return;
    visiting.add(sectionId);
    for (const target of edges.get(sectionId) ?? []) visit(target);
    visiting.delete(sectionId);
    visited.add(sectionId);
  }
  if (firstSection) visit(firstSection);

  if (cycleFound) {
    issues.push({
      code: 'NAVIGATION_CYCLE',
      path: '/navigation',
      message: 'PoC-1 navigation must not contain a cycle',
    });
  }

  return issues;
}
