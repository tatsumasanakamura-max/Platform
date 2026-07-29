import { Label, Radio, RadioGroup, type RadioGroupProps } from 'react-aria-components';
import type { FieldOption } from '../../domain/form-definition';
import styles from '../components.module.css';
import { FieldError } from './FieldError';
import { InlineHelp } from './InlineHelp';

interface RadioGroupFieldProps extends Pick<
  RadioGroupProps,
  'value' | 'onChange' | 'onBlur' | 'isRequired' | 'isInvalid'
> {
  name: string;
  label: string;
  description?: string;
  error?: string;
  options: FieldOption[];
}

export function RadioGroupField({
  name,
  label,
  description,
  error,
  options,
  ...props
}: RadioGroupFieldProps) {
  return (
    <RadioGroup
      {...props}
      name={name}
      className={`${styles.field} ${styles.radioGroup}`}
      validationBehavior="aria"
    >
      <Label className={styles.label}>
        {label}
        {!props.isRequired && <span className={styles.optional}>任意</span>}
      </Label>
      {description && <InlineHelp>{description}</InlineHelp>}
      {options.map((option) => (
        <Radio key={option.value} value={option.value} className={styles.radio}>
          {option.label}
        </Radio>
      ))}
      <FieldError>{error}</FieldError>
    </RadioGroup>
  );
}
