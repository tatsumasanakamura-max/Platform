import type { Answers } from '../../domain/answers';
import type { FieldDefinition } from '../../domain/form-definition';
import type { ApplicationValues } from './ApplicationForm';

export function toFormName(fieldId: string): string {
  return fieldId.replaceAll('.', '__');
}

export function toAnswers(values: ApplicationValues, fields: FieldDefinition[]): Answers {
  return Object.fromEntries(
    fields.map((field) => [field.field_id, values[toFormName(field.field_id)]]),
  );
}
