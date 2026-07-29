import type { Answers } from '../../domain/answers';
import type { FieldDefinition } from '../../domain/form-definition';
import styles from '../components.module.css';

function displayValue(field: FieldDefinition, value: Answers[string]): string {
  if (value === undefined || value === null || value === '') return '未入力';
  if (field.type === 'enum') {
    return field.options?.find((option) => option.value === value)?.label ?? String(value);
  }
  return String(value);
}

export function ConfirmationCard({
  fields,
  answers,
}: {
  fields: FieldDefinition[];
  answers: Answers;
}) {
  return (
    <div className={styles.card}>
      <dl className={styles.confirmationList}>
        {fields.map((field) => (
          <div className={styles.confirmationRow} key={field.field_id}>
            <dt>{field.label}</dt>
            <dd>{displayValue(field, answers[field.field_id])}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
