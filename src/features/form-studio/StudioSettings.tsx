import { useState } from 'react';
import type { AnswerValue, Answers } from '../../domain/answers';
import type {
  FieldControlType,
  FieldDefinition,
  FormDefinition,
  ValidatorDefinition,
  ValidatorType,
} from '../../domain/form-definition';
import { fieldControlTypes, validatorTypes } from '../../domain/form-definition';
import { validateNamedList } from '../../domain/validators';
import {
  getFieldGroup,
  isSimpleCondition,
  moveFieldToSection,
  renameField,
  setFieldGroup,
  setSimpleCondition,
  updateField,
  type SimpleConditionInput,
  type SimpleConditionOperator,
} from './studio-model';
import { LabeledInput, LabeledSelect, LabeledTextarea, StudioButton } from './StudioControls';
import { controlLabels } from './studio-constants';
import styles from './FormStudio.module.css';

const validatorLabels: Record<ValidatorType, string> = {
  minLength: '最小文字数',
  maxLength: '最大文字数',
  minValue: '最小値',
  maxValue: '最大値',
  email: 'メールアドレス形式',
  postalCodeJP: '郵便番号形式',
  phoneJP: '電話番号形式',
  katakana: 'カタカナ',
  date: '日付',
};
export type Commit = (next: FormDefinition, message: string, selection?: string) => void;

function fieldTypeFor(control: FieldControlType): FieldDefinition['type'] {
  if (control === 'number') return 'integer';
  if (control === 'date') return 'date';
  if (control === 'radio' || control === 'select') return 'enum';
  if (control === 'checkbox') return 'boolean';
  return 'string';
}

export function SettingsPanel({
  draft,
  field,
  sectionId,
  answers,
  onAnswers,
  onCommit,
  onPreviewError,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  sectionId: string;
  answers: Answers;
  onAnswers: (answers: Answers) => void;
  onCommit: Commit;
  onPreviewError: () => void;
}) {
  const [tab, setTab] = useState<'basic' | 'wording' | 'validation' | 'conditions' | 'test'>(
    'basic',
  );
  const value = answers[field.field_id];
  const result = validateNamedList(value, field.validators);
  const previewError =
    field.required && (value === undefined || value === null || value === '')
      ? `${field.label}を入力してください`
      : result.valid
        ? undefined
        : (field.validators?.find((validator) => validator.error_code === result.errorCode)
            ?.message ?? `${field.label}の入力内容を確認してください`);
  return (
    <>
      <div className={styles.selectedSummary}>
        <strong>{field.label}</strong>
        <code>{field.field_id}</code>
      </div>
      <div className={styles.settingsTabs} role="tablist" aria-label="設定カテゴリ">
        {(
          [
            ['basic', '基本'],
            ['wording', '文言'],
            ['validation', '検証'],
            ['conditions', '条件'],
            ['test', 'テスト'],
          ] as const
        ).map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div className={styles.settingsBody}>
        {tab === 'basic' && (
          <BasicSettings draft={draft} field={field} sectionId={sectionId} onCommit={onCommit} />
        )}
        {tab === 'wording' && <WordingSettings draft={draft} field={field} onCommit={onCommit} />}
        {tab === 'validation' && (
          <ValidationSettings draft={draft} field={field} onCommit={onCommit} />
        )}
        {tab === 'conditions' && (
          <ConditionSettings draft={draft} field={field} onCommit={onCommit} />
        )}
        {tab === 'test' && (
          <div className={styles.settingsSection}>
            <h3>バリデーション動作確認</h3>
            <LabeledInput
              label="テスト値"
              value={String(value ?? '')}
              onChange={(event) => onAnswers({ ...answers, [field.field_id]: event.target.value })}
            />
            <StudioButton onClick={onPreviewError}>エラー表示をプレビュー</StudioButton>
            <div className={previewError ? styles.testError : styles.testSuccess} role="status">
              <strong>{previewError ? '! エラー' : '✓ 正常'}</strong>
              <span>{previewError ?? '設定中のバリデーションを通過しました'}</span>
              {previewError && <code>{testErrorCode(field, value)}</code>}
            </div>
            <LabeledTextarea
              label="未解決事項"
              hint="Studioだけでは決められない事項を1行ずつ入力します"
              value={(draft.open_questions ?? []).join('\n')}
              onChange={(event) =>
                onCommit(
                  { ...draft, open_questions: event.target.value.split('\n').filter(Boolean) },
                  '未解決事項を更新しました',
                )
              }
              rows={5}
            />
          </div>
        )}
      </div>
    </>
  );
}

function BasicSettings({
  draft,
  field,
  sectionId,
  onCommit,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  sectionId: string;
  onCommit: Commit;
}) {
  const control =
    field.ui_type ??
    (field.type === 'enum'
      ? 'radio'
      : field.type === 'boolean'
        ? 'checkbox'
        : field.type === 'date'
          ? 'date'
          : 'text');
  const groupId = getFieldGroup(draft, field.field_id);
  return (
    <div className={styles.settingsSection}>
      <h3>基本属性</h3>
      <LabeledInput
        label="form_version"
        hint="差分出力の対象版です。公開済み定義を変更した場合は更新します"
        value={draft.form_version}
        onChange={(event) =>
          onCommit(
            { ...draft, form_version: event.target.value },
            'フォームバージョンを更新しました',
          )
        }
      />
      <LabeledInput
        label="項目ID"
        value={field.field_id}
        onChange={(event) => {
          const id = event.target.value;
          onCommit(renameField(draft, field.field_id, id), '項目IDを更新しました', id);
        }}
      />
      <LabeledSelect
        label="項目形式"
        value={control}
        onChange={(event) => {
          const nextControl = event.target.value as FieldControlType;
          onCommit(
            updateField(draft, field.field_id, {
              ui_type: nextControl,
              type: fieldTypeFor(nextControl),
              ...(nextControl === 'radio' || nextControl === 'select'
                ? { options: field.options ?? [{ value: 'OPTION_1', label: '選択肢1' }] }
                : {}),
            }),
            '項目形式を更新しました',
          );
        }}
      >
        {fieldControlTypes.map((item) => (
          <option key={item} value={item}>
            {controlLabels[item]}
          </option>
        ))}
      </LabeledSelect>
      <label className={styles.checkSetting}>
        <input
          type="checkbox"
          checked={field.required}
          onChange={(event) =>
            onCommit(
              updateField(draft, field.field_id, { required: event.target.checked }),
              '必須状態を更新しました',
            )
          }
        />
        この項目を固定で必須にする
      </label>
      <LabeledSelect
        label="所属セクション"
        value={sectionId}
        onChange={(event) =>
          onCommit(
            moveFieldToSection(draft, field.field_id, event.target.value),
            '所属セクションを更新しました',
          )
        }
      >
        {draft.sections.map((section) => (
          <option key={section.section_id} value={section.section_id}>
            {section.label}
          </option>
        ))}
      </LabeledSelect>
      <LabeledInput
        label="所属グループID"
        hint="画面構造上の親子関係。空欄でグループなし"
        value={groupId}
        onChange={(event) =>
          onCommit(
            setFieldGroup(draft, field.field_id, event.target.value),
            'グループ設定を更新しました',
          )
        }
      />
      {(control === 'radio' || control === 'select') && (
        <OptionsEditor draft={draft} field={field} onCommit={onCommit} />
      )}
      <LabeledInput
        label="autocomplete"
        value={field.autocomplete ?? ''}
        onChange={(event) =>
          onCommit(
            updateField(draft, field.field_id, { autocomplete: event.target.value || undefined }),
            'autocompleteを更新しました',
          )
        }
      />
      <LabeledSelect
        label="inputMode"
        value={field.input_mode ?? 'text'}
        onChange={(event) =>
          onCommit(
            updateField(draft, field.field_id, {
              input_mode: event.target.value as FieldDefinition['input_mode'],
            }),
            'inputModeを更新しました',
          )
        }
      >
        {['text', 'email', 'tel', 'numeric', 'decimal'].map((item) => (
          <option key={item}>{item}</option>
        ))}
      </LabeledSelect>
    </div>
  );
}

function OptionsEditor({
  draft,
  field,
  onCommit,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  onCommit: Commit;
}) {
  const options = field.options ?? [];
  return (
    <fieldset className={styles.fieldset}>
      <legend>選択肢</legend>
      {options.map((option, index) => (
        <div className={styles.optionRow} key={`${option.value}-${index}`}>
          <input
            aria-label={`選択肢${index + 1}の値`}
            value={option.value}
            onChange={(event) => {
              const next = structuredClone(options);
              next[index].value = event.target.value;
              onCommit(
                updateField(draft, field.field_id, { options: next }),
                '選択肢を更新しました',
              );
            }}
          />
          <input
            aria-label={`選択肢${index + 1}のラベル`}
            value={option.label}
            onChange={(event) => {
              const next = structuredClone(options);
              next[index].label = event.target.value;
              onCommit(
                updateField(draft, field.field_id, { options: next }),
                '選択肢を更新しました',
              );
            }}
          />
          <button
            type="button"
            aria-label={`選択肢${index + 1}を削除`}
            onClick={() =>
              onCommit(
                updateField(draft, field.field_id, {
                  options: options.filter((_, itemIndex) => itemIndex !== index),
                }),
                '選択肢を削除しました',
              )
            }
          >
            ×
          </button>
        </div>
      ))}
      <StudioButton
        onClick={() =>
          onCommit(
            updateField(draft, field.field_id, {
              options: [
                ...options,
                { value: `OPTION_${options.length + 1}`, label: `選択肢${options.length + 1}` },
              ],
            }),
            '選択肢を追加しました',
          )
        }
      >
        ＋ 選択肢
      </StudioButton>
    </fieldset>
  );
}

function WordingSettings({
  draft,
  field,
  onCommit,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  onCommit: Commit;
}) {
  const change = (property: keyof FieldDefinition, value: string, message: string) =>
    onCommit(
      updateField(draft, field.field_id, {
        [property]: property === 'label' ? value : value || undefined,
      }),
      message,
    );
  return (
    <div className={styles.settingsSection}>
      <h3>画面文言</h3>
      <LabeledInput
        label="ラベル"
        hint="常に表示される項目名"
        value={field.label}
        onChange={(event) => change('label', event.target.value, 'ラベルを更新しました')}
      />
      <LabeledInput
        label="プレースホルダー"
        hint="未入力時だけ入力欄内に表示"
        value={field.placeholder ?? ''}
        onChange={(event) =>
          change('placeholder', event.target.value, 'プレースホルダーを更新しました')
        }
      />
      <LabeledInput
        label="入力例"
        hint="入力欄の外側に表示"
        value={field.example ?? ''}
        onChange={(event) => change('example', event.target.value, '入力例を更新しました')}
      />
      <LabeledTextarea
        label="ヘルプ"
        hint="必要な理由や入力方法"
        value={field.help_text ?? ''}
        onChange={(event) => change('help_text', event.target.value, 'ヘルプを更新しました')}
        rows={3}
      />
      <LabeledTextarea
        label="補足説明"
        value={field.supplemental_text ?? ''}
        onChange={(event) =>
          change('supplemental_text', event.target.value, '補足説明を更新しました')
        }
        rows={2}
      />
      <LabeledInput
        label="単位"
        value={field.unit ?? ''}
        onChange={(event) => change('unit', event.target.value, '単位を更新しました')}
      />
    </div>
  );
}

function ValidationSettings({
  draft,
  field,
  onCommit,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  onCommit: Commit;
}) {
  const validators = field.validators ?? [];
  const replace = (index: number, patch: Partial<ValidatorDefinition>) => {
    const next = structuredClone(validators);
    next[index] = { ...next[index], ...patch };
    onCommit(
      updateField(draft, field.field_id, { validators: next }),
      'バリデーションを更新しました',
    );
  };
  return (
    <div className={styles.settingsSection}>
      <h3>名前付きバリデーター</h3>
      {validators.map((validator, index) => (
        <fieldset className={styles.validatorCard} key={`${validator.type}-${index}`}>
          <legend>{validatorLabels[validator.type]}</legend>
          <LabeledSelect
            label="validator"
            value={validator.type}
            onChange={(event) =>
              replace(index, {
                type: event.target.value as ValidatorType,
                value: ['minLength', 'maxLength', 'minValue', 'maxValue'].includes(
                  event.target.value,
                )
                  ? (validator.value ?? 1)
                  : undefined,
              })
            }
          >
            {validatorTypes.map((type) => (
              <option key={type} value={type}>
                {validatorLabels[type]}
              </option>
            ))}
          </LabeledSelect>
          {['minLength', 'maxLength', 'minValue', 'maxValue'].includes(validator.type) && (
            <LabeledInput
              label="設定値"
              type="number"
              value={validator.value ?? 1}
              onChange={(event) => replace(index, { value: Number(event.target.value) })}
            />
          )}
          <LabeledInput
            label="error_code"
            value={validator.error_code}
            onChange={(event) => replace(index, { error_code: event.target.value })}
          />
          <LabeledTextarea
            label="日本語エラーメッセージ"
            value={validator.message ?? ''}
            onChange={(event) => replace(index, { message: event.target.value || undefined })}
            rows={2}
          />
          <StudioButton
            onClick={() =>
              onCommit(
                updateField(draft, field.field_id, {
                  validators: validators.filter((_, itemIndex) => itemIndex !== index),
                }),
                'バリデーターを削除しました',
              )
            }
          >
            このバリデーターを削除
          </StudioButton>
        </fieldset>
      ))}
      <StudioButton
        onClick={() =>
          onCommit(
            updateField(draft, field.field_id, {
              validators: [
                ...validators,
                {
                  type: 'maxLength',
                  value: 40,
                  error_code: 'MAX_LENGTH',
                  message: '40文字以内で入力してください',
                },
              ],
            }),
            'バリデーターを追加しました',
          )
        }
      >
        ＋ バリデーター
      </StudioButton>
    </div>
  );
}

function ConditionSettings({
  draft,
  field,
  onCommit,
}: {
  draft: FormDefinition;
  field: FieldDefinition;
  onCommit: Commit;
}) {
  return (
    <div className={styles.settingsSection}>
      <h3>条件上の依存関係</h3>
      <p className={styles.settingHint}>画面構造のグループとは別に、既存ルールとして保存します。</p>
      <ConditionEditor
        label="表示条件"
        type="visibility"
        draft={draft}
        field={field}
        onCommit={onCommit}
      />
      <ConditionEditor
        label="必須条件"
        type="required"
        draft={draft}
        field={field}
        onCommit={onCommit}
      />
    </div>
  );
}

function ConditionEditor({
  label,
  type,
  draft,
  field,
  onCommit,
}: {
  label: string;
  type: 'visibility' | 'required';
  draft: FormDefinition;
  field: FieldDefinition;
  onCommit: Commit;
}) {
  const ruleId = type === 'visibility' ? field.visibility_rule_id : field.required_rule_id;
  const rule = draft.rules.find((candidate) => candidate.rule_id === ruleId);
  const simple = rule && isSimpleCondition(rule.condition) ? rule.condition : undefined;
  const unsupported = Boolean(rule && !simple);
  const sources = draft.sections
    .flatMap((section) => section.fields)
    .filter((candidate) => candidate.field_id !== field.field_id);
  const enabled = Boolean(ruleId);
  function apply(patch: Partial<SimpleConditionInput>) {
    const current: SimpleConditionInput = simple
      ? { field: simple.field, op: simple.op as SimpleConditionOperator, value: simple.value }
      : { field: sources[0]?.field_id ?? '', op: 'equals', value: '' };
    onCommit(
      setSimpleCondition(draft, field.field_id, type, { ...current, ...patch }),
      `${label}を更新しました`,
    );
  }
  return (
    <fieldset className={styles.fieldset}>
      <legend>{label}</legend>
      {unsupported ? (
        <div className={styles.readOnlyCondition}>
          <strong>△ 複合条件は読取専用です</strong>
          <code>{JSON.stringify(rule?.condition)}</code>
        </div>
      ) : (
        <>
          <label className={styles.checkSetting}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) =>
                event.target.checked
                  ? apply({})
                  : onCommit(
                      setSimpleCondition(draft, field.field_id, type, null),
                      `${label}を解除しました`,
                    )
              }
            />
            {label}を使用する
          </label>
          {enabled && (
            <>
              <LabeledSelect
                label="基準項目"
                value={simple?.field ?? sources[0]?.field_id ?? ''}
                onChange={(event) => apply({ field: event.target.value })}
              >
                {sources.map((candidate) => (
                  <option key={candidate.field_id} value={candidate.field_id}>
                    {candidate.label}
                  </option>
                ))}
              </LabeledSelect>
              <LabeledSelect
                label="演算子"
                value={simple?.op ?? 'equals'}
                onChange={(event) => apply({ op: event.target.value as SimpleConditionOperator })}
              >
                <option value="equals">次の値と等しい</option>
                <option value="notEquals">次の値と等しくない</option>
                <option value="in">いずれかに含まれる</option>
                <option value="exists">回答が存在する</option>
              </LabeledSelect>
              {(simple?.op ?? 'equals') !== 'exists' && (
                <LabeledInput
                  label="比較値"
                  value={
                    Array.isArray(simple?.value)
                      ? simple.value.join(',')
                      : String(simple?.value ?? '')
                  }
                  onChange={(event) =>
                    apply({
                      value:
                        (simple?.op ?? 'equals') === 'in'
                          ? event.target.value.split(',').map((value) => value.trim())
                          : event.target.value,
                    })
                  }
                />
              )}
            </>
          )}
        </>
      )}
    </fieldset>
  );
}

function testErrorCode(field: FieldDefinition, value: AnswerValue): string {
  if (field.required && (value === undefined || value === null || value === '')) return 'REQUIRED';
  const result = validateNamedList(value, field.validators);
  return result.valid ? '' : result.errorCode;
}
