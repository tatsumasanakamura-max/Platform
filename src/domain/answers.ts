import type { FormDefinition } from './form-definition';
import { isFieldVisible } from './rule-engine';

export type AnswerValue = string | number | boolean | null | undefined;
export type Answers = Record<string, AnswerValue>;

export function buildSubmissionPayload(definition: FormDefinition, answers: Answers): Answers {
  const payload: Answers = {};

  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (
        isFieldVisible(field, definition.rules, answers) &&
        answers[field.field_id] !== undefined
      ) {
        payload[field.field_id] = answers[field.field_id];
      }
    }
  }

  return payload;
}
