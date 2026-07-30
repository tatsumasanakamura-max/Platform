import { Checkbox } from 'react-aria-components';
import styles from '../components.module.css';

interface CheckboxFieldProps {
  name: string;
  label: string;
  description?: string;
  error?: string;
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  onBlur?: () => void;
  isRequired?: boolean;
  isInvalid?: boolean;
}

export function CheckboxField({
  name,
  label,
  description,
  error,
  isSelected,
  onChange,
  onBlur,
  isRequired,
  isInvalid,
}: CheckboxFieldProps) {
  const descriptionId = `${name}-description`;
  const errorId = `${name}-error`;
  return (
    <div className={styles.field}>
      <Checkbox
        name={name}
        isSelected={isSelected}
        onChange={onChange}
        onBlur={onBlur}
        isInvalid={isInvalid}
        aria-describedby={
          [description ? descriptionId : '', error ? errorId : ''].filter(Boolean).join(' ') ||
          undefined
        }
        className={styles.checkbox}
      >
        <span className={styles.checkboxBox} aria-hidden="true">
          ✓
        </span>
        <span>
          {label}
          {!isRequired && <span className={styles.optional}>任意</span>}
        </span>
      </Checkbox>
      {description && (
        <span id={descriptionId} className={styles.description}>
          {description}
        </span>
      )}
      {error && (
        <span id={errorId} className={styles.fieldError}>
          <span aria-hidden="true">!</span>
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
