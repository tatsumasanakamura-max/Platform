import type { Ref } from 'react';
import type { AnswerValue } from '../../domain/answers';
import type { FieldControlType, FieldDefinition } from '../../domain/form-definition';
import { CheckboxField } from '../../components/fields/CheckboxField';
import { RadioGroupField } from '../../components/fields/RadioGroupField';
import { SelectField } from '../../components/fields/SelectField';
import { TextField } from '../../components/fields/TextField';

interface RuntimeFieldProps {
  field: FieldDefinition;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  isRequired: boolean;
  error?: string;
}

function resolveFieldControl(field: FieldDefinition): FieldControlType {
  if (field.ui_type) return field.ui_type;
  if (field.type === 'enum') return 'radio';
  if (field.type === 'boolean') return 'checkbox';
  if (field.type === 'date') return 'date';
  if (field.type === 'integer' || field.type === 'decimal') return 'number';
  if (field.input_mode === 'email') return 'email';
  if (field.input_mode === 'tel') return 'tel';
  return 'text';
}

function supportingDescription(field: FieldDefinition): string | undefined {
  const descriptions = [field.description, field.help_text, field.supplemental_text].filter(
    (item): item is string => Boolean(item),
  );
  return [...new Set(descriptions)].join(' ') || undefined;
}

export function RuntimeField({
  field,
  value,
  onChange,
  onBlur,
  inputRef,
  isRequired,
  error,
}: RuntimeFieldProps) {
  const control = resolveFieldControl(field);
  const description = supportingDescription(field);

  if (control === 'radio') {
    return (
      <RadioGroupField
        name={field.field_id}
        label={field.label}
        description={[description, field.example ? `入力例: ${field.example}` : '']
          .filter(Boolean)
          .join(' ')}
        options={field.options ?? []}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        onBlur={onBlur}
        isRequired={isRequired}
        isInvalid={Boolean(error)}
        error={error}
      />
    );
  }

  if (control === 'select') {
    return (
      <SelectField
        name={field.field_id}
        label={field.label}
        description={[description, field.example ? `入力例: ${field.example}` : '']
          .filter(Boolean)
          .join(' ')}
        options={field.options ?? []}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        onBlur={onBlur}
        isRequired={isRequired}
        isInvalid={Boolean(error)}
        error={error}
      />
    );
  }

  if (control === 'checkbox') {
    return (
      <CheckboxField
        name={field.field_id}
        label={field.label}
        description={description}
        isSelected={value === true}
        onChange={onChange}
        onBlur={onBlur}
        isRequired={isRequired}
        isInvalid={Boolean(error)}
        error={error}
      />
    );
  }

  const inputType =
    control === 'date'
      ? 'date'
      : control === 'email'
        ? 'email'
        : control === 'tel'
          ? 'tel'
          : 'text';
  const inputMode =
    control === 'number' ? (field.type === 'decimal' ? 'decimal' : 'numeric') : field.input_mode;

  return (
    <TextField
      name={field.field_id}
      label={field.label}
      description={field.description}
      example={field.example}
      helpText={field.help_text}
      supplementalText={field.supplemental_text}
      unit={field.unit}
      placeholder={field.placeholder}
      value={value === undefined || value === null ? '' : String(value)}
      onChange={(next) => {
        if (control === 'number') onChange(next === '' ? '' : Number(next));
        else onChange(next);
      }}
      onBlur={onBlur}
      inputRef={inputRef}
      type={inputType}
      inputMode={inputMode}
      autoComplete={field.autocomplete}
      isRequired={isRequired}
      isInvalid={Boolean(error)}
      error={error}
    />
  );
}
