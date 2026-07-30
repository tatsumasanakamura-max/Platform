import {
  Input,
  Label,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import styles from '../components.module.css';
import { FieldError } from './FieldError';
import { InlineHelp } from './InlineHelp';

interface TextFieldProps extends Pick<
  AriaTextFieldProps,
  'value' | 'onChange' | 'onBlur' | 'isRequired' | 'isInvalid'
> {
  name: string;
  label: string;
  description?: string;
  example?: string;
  helpText?: string;
  supplementalText?: string;
  unit?: string;
  placeholder?: string;
  error?: string;
  type?: 'text' | 'email' | 'tel' | 'date';
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
}

export function TextField({
  name,
  label,
  description,
  example,
  helpText,
  supplementalText,
  unit,
  placeholder,
  error,
  type = 'text',
  inputMode,
  autoComplete,
  inputRef,
  ...props
}: TextFieldProps) {
  const supportingText = [
    ...new Set(
      [
        description,
        example ? `入力例: ${example}` : undefined,
        helpText,
        unit ? `単位: ${unit}` : undefined,
        supplementalText,
      ].filter((value): value is string => Boolean(value)),
    ),
  ];

  return (
    <AriaTextField {...props} name={name} className={styles.field} validationBehavior="aria">
      <Label className={styles.label}>
        {label}
        {!props.isRequired && <span className={styles.optional}>任意</span>}
      </Label>
      {supportingText.length > 0 && <InlineHelp>{supportingText.join(' ')}</InlineHelp>}
      <Input
        ref={inputRef}
        className={styles.input}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      <FieldError>{error}</FieldError>
    </AriaTextField>
  );
}
