import { useEffect } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import type { Answers, AnswerValue } from '../../domain/answers';
import type { FieldDefinition, FormDefinition } from '../../domain/form-definition';
import { evaluateValidationRules, isFieldRequired, isFieldVisible } from '../../domain/rule-engine';
import { validateNamedList } from '../../domain/validators';
import { getErrorMessage } from '../../messages/errors.ja';
import { PrimaryButton, SecondaryButton } from '../../components/buttons/Buttons';
import { ErrorSummary, type SummaryError } from '../../components/errors/ErrorSummary';
import { SectionHeading } from '../../components/layout/SectionHeading';
import { RuntimeField } from './RuntimeField';
import { toAnswers, toFormName } from './form-state';
import styles from './ApplicationForm.module.css';

export type ApplicationValues = Record<string, AnswerValue>;

interface ApplicationFormProps {
  definition: FormDefinition;
  form: UseFormReturn<ApplicationValues>;
  onValid: (answers: Answers) => void;
  onBack: () => void;
}

function isBlank(value: AnswerValue): boolean {
  return value === undefined || value === null || value === '';
}

export function ApplicationForm({ definition, form, onValid, onBack }: ApplicationFormProps) {
  const section = definition.sections.find((candidate) => candidate.section_id === 'personal');
  if (!section) throw new Error('personal section is missing');
  const fields = section.fields;

  const answers = toAnswers(form.watch(), fields);
  const visibleFields = fields.filter((field) => isFieldVisible(field, definition.rules, answers));

  useEffect(() => {
    for (const field of fields) {
      if (!isFieldVisible(field, definition.rules, answers))
        form.unregister(toFormName(field.field_id));
    }
  }, [answers, definition.rules, form, fields]);

  const summaryErrors: SummaryError[] = visibleFields.flatMap((field) => {
    const error = form.formState.errors[toFormName(field.field_id)];
    return typeof error?.message === 'string'
      ? [{ fieldId: field.field_id, message: error.message }]
      : [];
  });

  function validateField(field: FieldDefinition, value: AnswerValue): true | string {
    const currentAnswers = toAnswers(form.getValues(), fields);
    if (isFieldRequired(field, definition.rules, currentAnswers) && isBlank(value)) {
      return `${field.label}を入力してください`;
    }
    const namedResult = validateNamedList(value, field.validators);
    if (!namedResult.valid) {
      return (
        field.validators?.find((validator) => validator.error_code === namedResult.errorCode)
          ?.message ?? getErrorMessage(namedResult.errorCode)
      );
    }
    const ruleErrors = evaluateValidationRules(field, definition.rules, currentAnswers);
    return ruleErrors.length > 0 ? getErrorMessage(ruleErrors[0]) : true;
  }

  return (
    <form
      noValidate
      className={styles.form}
      onSubmit={form.handleSubmit((values) => onValid(toAnswers(values, fields)))}
    >
      <SectionHeading title={section.label} description={section.description} />
      <ErrorSummary
        errors={form.formState.submitCount > 0 ? summaryErrors : []}
        focusRequestId={form.formState.submitCount}
      />

      <div className={styles.fields}>
        {visibleFields.map((field) => {
          const isRequired = isFieldRequired(field, definition.rules, answers);
          const error = form.formState.errors[toFormName(field.field_id)]?.message;
          return (
            <Controller
              key={field.field_id}
              name={toFormName(field.field_id)}
              control={form.control}
              defaultValue={field.default_value ?? (resolveCheckbox(field) ? false : '')}
              rules={{ validate: (value) => validateField(field, value) }}
              render={({ field: controller }) => (
                <RuntimeField
                  field={field}
                  value={controller.value}
                  onChange={controller.onChange}
                  onBlur={controller.onBlur}
                  inputRef={controller.ref}
                  isRequired={isRequired}
                  error={typeof error === 'string' ? error : undefined}
                />
              )}
            />
          );
        })}
      </div>

      <div className={styles.actions}>
        <PrimaryButton type="submit">入力内容を確認する</PrimaryButton>
        <SecondaryButton type="button" onPress={onBack}>
          デモ説明に戻る
        </SecondaryButton>
      </div>
    </form>
  );
}

function resolveCheckbox(field: FieldDefinition): boolean {
  return field.ui_type === 'checkbox' || (!field.ui_type && field.type === 'boolean');
}
