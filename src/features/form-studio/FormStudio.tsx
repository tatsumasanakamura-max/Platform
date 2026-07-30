import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { AnswerValue, Answers } from '../../domain/answers';
import type {
  FieldControlType,
  FieldDefinition,
  FormDefinition,
} from '../../domain/form-definition';
import { fieldControlTypes } from '../../domain/form-definition';
import { isFieldRequired, isFieldVisible } from '../../domain/rule-engine';
import { validateNamedList } from '../../domain/validators';
import { ErrorSummary } from '../../components/errors/ErrorSummary';
import { RuntimeField } from '../application-form/RuntimeField';
import {
  addField,
  cloneDefinition,
  deleteField,
  duplicateField,
  findField,
  getFieldGroup,
  moveField,
  moveFieldToSection,
} from './studio-model';
import {
  generateChangeManifest,
  generateFieldCatalog,
  generateOpenQuestions,
  generateRuleCatalog,
  generateValidationCatalog,
} from './studio-export';
import { loadDraft, saveDraft } from './studio-storage';
import { validateStudioDefinition } from './studio-validation';
import { SettingsPanel, type Commit } from './StudioSettings';
import { controlLabels } from './studio-constants';
import { LabeledSelect, StudioButton } from './StudioControls';
import styles from './FormStudio.module.css';

type Pane = 'structure' | 'preview' | 'settings';
type PreviewMode = 'normal' | 'error' | 'scenario';

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function testField(
  field: FieldDefinition,
  value: AnswerValue,
  definition: FormDefinition,
  answers: Answers,
): string | undefined {
  const blank = value === undefined || value === null || value === '';
  if (isFieldRequired(field, definition.rules, answers) && blank)
    return `${field.label}を入力してください`;
  const result = validateNamedList(value, field.validators);
  if (result.valid) return undefined;
  return (
    field.validators?.find((validator) => validator.error_code === result.errorCode)?.message ??
    `${field.label}の入力内容を確認してください`
  );
}

export function FormStudio({ initialDefinition }: { initialDefinition: FormDefinition }) {
  const initial = useMemo(() => cloneDefinition(initialDefinition), [initialDefinition]);
  const [baseline, setBaseline] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [past, setPast] = useState<FormDefinition[]>([]);
  const [future, setFuture] = useState<FormDefinition[]>([]);
  const [savedJson, setSavedJson] = useState(JSON.stringify(initial));
  const [selectedFieldId, setSelectedFieldId] = useState(
    initial.sections[0]?.fields[0]?.field_id ?? '',
  );
  const [previewSectionId, setPreviewSectionId] = useState(initial.sections[0]?.section_id ?? '');
  const [answers, setAnswers] = useState<Answers>({});
  const [previewMode, setPreviewMode] = useState<PreviewMode>('normal');
  const [scenarioId, setScenarioId] = useState('');
  const [activePane, setActivePane] = useState<Pane>('structure');
  const [newControl, setNewControl] = useState<FieldControlType>('text');
  const [moveTarget, setMoveTarget] = useState(initial.sections[0]?.section_id ?? '');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [status, setStatus] = useState('Studioを開始しました');
  const [importError, setImportError] = useState('');
  const [validationFocusId, setValidationFocusId] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelDeleteRef = useRef<HTMLButtonElement>(null);
  const confirmDeleteRef = useRef<HTMLButtonElement>(null);

  const selectedField = findField(draft, selectedFieldId);
  const selectedSection = draft.sections.find((section) =>
    section.fields.some((field) => field.field_id === selectedFieldId),
  );
  const issues = useMemo(() => validateStudioDefinition(draft, baseline), [draft, baseline]);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const warnings = issues.filter((issue) => issue.severity === 'warning');
  const dirty = JSON.stringify(draft) !== savedJson;

  const commit: Commit = (next, message, selection) => {
    if (JSON.stringify(next) === JSON.stringify(draft)) return;
    setPast((items) => [...items.slice(-49), draft]);
    setDraft(next);
    setFuture([]);
    if (selection !== undefined) setSelectedFieldId(selection);
    setStatus(message);
  };

  function undo() {
    const previous = past.at(-1);
    if (!previous) return;
    setFuture((items) => [draft, ...items]);
    setDraft(previous);
    setPast((items) => items.slice(0, -1));
    setStatus('元に戻しました');
  }
  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, draft]);
    setDraft(next);
    setFuture((items) => items.slice(1));
    setStatus('やり直しました');
  }

  useEffect(() => {
    if (deleteTarget) cancelDeleteRef.current?.focus();
  }, [deleteTarget]);

  const previewSection =
    draft.sections.find((section) => section.section_id === previewSectionId) ?? draft.sections[0];
  const previewFields = (previewSection?.fields ?? []).filter((field) =>
    isFieldVisible(field, draft.rules, answers),
  );
  const activeScenario = draft.scenarios?.find((scenario) => scenario.scenario_id === scenarioId);
  const visibleFieldIds = new Set(
    draft.sections.flatMap((section) =>
      section.fields
        .filter((field) => isFieldVisible(field, draft.rules, answers))
        .map((field) => field.field_id),
    ),
  );
  const missingExpectedFields = (activeScenario?.expected?.visible_field_ids ?? []).filter(
    (fieldId) => !visibleFieldIds.has(fieldId),
  );
  const previewError = selectedField
    ? testField(selectedField, answers[selectedField.field_id], draft, answers)
    : undefined;
  const previewErrors =
    previewMode === 'error' && selectedField && previewError
      ? [{ fieldId: selectedField.field_id, message: previewError }]
      : [];

  function saveLocal() {
    if (errors.length) {
      setStatus('エラーがあるため保存できません');
      return;
    }
    saveDraft(window.localStorage, draft);
    setSavedJson(JSON.stringify(draft));
    setStatus('仮想商品のDraftをこのブラウザへ保存しました');
  }
  function loadLocal() {
    const stored = loadDraft(window.localStorage);
    if (!stored) {
      setStatus('読込可能なローカルDraftがありません');
      return;
    }
    if (dirty && !window.confirm('未保存の編集を破棄してローカルDraftを読み込みますか？')) return;
    loadAsBaseline(stored);
    setStatus('ローカルDraftを読み込みました');
  }
  function loadAsBaseline(next: FormDefinition) {
    setBaseline(cloneDefinition(next));
    setDraft(next);
    setPast([]);
    setFuture([]);
    setSavedJson(JSON.stringify(next));
    setSelectedFieldId(next.sections[0]?.fields[0]?.field_id ?? '');
    setPreviewSectionId(next.sections[0]?.section_id ?? '');
  }
  async function importJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const importedErrors = validateStudioDefinition(parsed).filter(
        (issue) => issue.severity === 'error',
      );
      if (importedErrors.length) {
        setImportError(importedErrors.map((issue) => issue.message).join(' / '));
        setStatus('JSONを読み込めませんでした。現在のDraftは保持されています');
        return;
      }
      if (dirty && !window.confirm('未保存の編集を破棄してJSONを読み込みますか？')) return;
      loadAsBaseline(parsed as FormDefinition);
      setImportError('');
      setStatus(`${file.name} を検証して読み込みました`);
    } catch {
      setImportError('JSONとして解析できませんでした');
      setStatus('JSONを読み込めませんでした。現在のDraftは保持されています');
    }
  }
  function exportGuard(action: () => void, success: string) {
    if (errors.length) {
      setStatus('エラーがあるためエクスポートできません');
      return;
    }
    action();
    setStatus(success);
  }
  function exportJson() {
    exportGuard(
      () =>
        download('form-definition.json', `${JSON.stringify(draft, null, 2)}\n`, 'application/json'),
      'form-definition.jsonを出力しました',
    );
  }
  function exportManifest() {
    exportGuard(
      () =>
        download(
          'change-manifest.json',
          `${JSON.stringify(generateChangeManifest(baseline, draft), null, 2)}\n`,
          'application/json',
        ),
      'change-manifest.jsonを出力しました',
    );
  }
  function exportDocuments() {
    exportGuard(() => {
      download('field-catalog.md', generateFieldCatalog(draft), 'text/markdown');
      download('validation-catalog.md', generateValidationCatalog(draft), 'text/markdown');
      download('rule-catalog.md', generateRuleCatalog(draft), 'text/markdown');
      download('open-questions.md', generateOpenQuestions(draft, issues), 'text/markdown');
      download(
        'scenarios.json',
        `${JSON.stringify(draft.scenarios ?? [], null, 2)}\n`,
        'application/json',
      );
    }, '要件確認用Markdownとscenarios.jsonを出力しました');
  }
  function selectField(id: string) {
    setSelectedFieldId(id);
    const section = draft.sections.find((candidate) =>
      candidate.fields.some((field) => field.field_id === id),
    );
    if (section) setPreviewSectionId(section.section_id);
    setActivePane('settings');
  }
  function handleTreeKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const items = [...document.querySelectorAll<HTMLButtonElement>('[data-field-item]')];
    const index = items.indexOf(event.currentTarget);
    items[index + (event.key === 'ArrowDown' ? 1 : -1)]?.focus();
  }
  function applyScenario(id: string) {
    setScenarioId(id);
    const scenario = draft.scenarios?.find((candidate) => candidate.scenario_id === id);
    if (scenario) {
      setAnswers(structuredClone(scenario.answers));
      setStatus(`シナリオ「${scenario.name}」を適用しました`);
    }
  }

  return (
    <div className={styles.studio}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>AI Native FormDefinition</p>
          <h1>フォーム要件定義スタジオ</h1>
          <p>
            {draft.bank_id} / {draft.product_id} / v{draft.form_version}
          </p>
        </div>
        <div className={styles.saveState} data-dirty={dirty}>
          {dirty ? '● 未保存の変更あり' : '✓ 保存済み'}
        </div>
      </header>
      <nav className={styles.toolbar} aria-label="Studio操作">
        <input
          ref={fileInputRef}
          className={styles.visuallyHidden}
          aria-label="FormDefinition JSONファイル"
          type="file"
          accept="application/json,.json"
          onChange={importJson}
        />
        <StudioButton onClick={() => fileInputRef.current?.click()}>JSON読込</StudioButton>
        <StudioButton onClick={loadLocal}>保存済読込</StudioButton>
        <StudioButton onClick={saveLocal} disabled={errors.length > 0}>
          保存
        </StudioButton>
        <StudioButton
          onClick={() => {
            setStatus(`検証完了: エラー${errors.length}件、警告${warnings.length}件`);
            setValidationFocusId((value) => value + 1);
          }}
        >
          検証
        </StudioButton>
        <StudioButton onClick={exportJson} disabled={errors.length > 0}>
          JSON出力
        </StudioButton>
        <StudioButton onClick={exportDocuments} disabled={errors.length > 0}>
          要件書出力
        </StudioButton>
        <StudioButton onClick={exportManifest} disabled={errors.length > 0}>
          差分出力
        </StudioButton>
        <StudioButton onClick={undo} disabled={!past.length}>
          Undo
        </StudioButton>
        <StudioButton onClick={redo} disabled={!future.length}>
          Redo
        </StudioButton>
        <StudioButton
          onClick={() => {
            if (window.confirm('現在の編集を破棄して初期状態へ戻しますか？')) {
              setPast((items) => [...items, draft]);
              setDraft(cloneDefinition(baseline));
              setFuture([]);
              setStatus('ベースラインへ戻しました。Undoで復元できます');
            }
          }}
        >
          初期状態へ戻す
        </StudioButton>
      </nav>
      <div className={styles.mobileTabs} role="tablist" aria-label="Studioペイン">
        {(
          [
            ['structure', '構成'],
            ['preview', 'プレビュー'],
            ['settings', '設定'],
          ] as const
        ).map(([pane, label]) => (
          <button
            key={pane}
            role="tab"
            aria-selected={activePane === pane}
            onClick={() => setActivePane(pane)}
          >
            {label}
          </button>
        ))}
      </div>
      {importError && (
        <div className={styles.errorBanner} role="alert">
          ! {importError}
        </div>
      )}

      <main className={styles.panes}>
        <section
          className={`${styles.pane} ${activePane === 'structure' ? styles.activePane : ''}`}
          aria-labelledby="structure-title"
        >
          <PaneHeader
            number="1"
            title="画面構成"
            id="structure-title"
            meta={`${draft.sections.reduce((sum, section) => sum + section.fields.length, 0)}項目`}
          />
          <div
            className={styles.tree}
            data-testid="field-tree"
            aria-label="フォームのセクションと項目"
          >
            {draft.sections.map((section) => (
              <details key={section.section_id} open className={styles.sectionNode}>
                <summary>
                  {section.label}
                  <span>{section.fields.length}</span>
                </summary>
                <div role="group" aria-label={section.label}>
                  {section.fields.map((field, index) => {
                    const count = issues.filter(
                      (issue) => issue.targetId === field.field_id,
                    ).length;
                    const group = getFieldGroup(draft, field.field_id);
                    return (
                      <button
                        key={field.field_id}
                        type="button"
                        aria-current={selectedFieldId === field.field_id ? 'true' : undefined}
                        data-testid="field-item"
                        data-field-item
                        className={styles.treeItem}
                        onClick={() => selectField(field.field_id)}
                        onKeyDown={handleTreeKey}
                      >
                        <span className={styles.order}>{index + 1}</span>
                        <span>
                          <strong>{field.label}</strong>
                          <small>
                            {group ? `${group} / ` : ''}
                            {field.required ? '必須' : '任意'}
                          </small>
                        </span>
                        {field.visibility_rule_id && <span title="表示条件あり">↳</span>}
                        {count > 0 && <span aria-label={`指摘${count}件`}>!{count}</span>}
                      </button>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
          <div className={styles.structureActions}>
            <LabeledSelect
              label="追加する項目形式"
              value={newControl}
              onChange={(event) => setNewControl(event.target.value as FieldControlType)}
            >
              {fieldControlTypes.map((control) => (
                <option key={control} value={control}>
                  {controlLabels[control]}
                </option>
              ))}
            </LabeledSelect>
            <StudioButton
              onClick={() => {
                const id = selectedSection?.section_id ?? draft.sections[0]?.section_id;
                if (!id) return;
                const result = addField(draft, id, newControl);
                commit(result.definition, '項目を追加しました', result.fieldId);
              }}
            >
              ＋ 項目を追加
            </StudioButton>
            <div className={styles.buttonGrid}>
              <StudioButton
                disabled={!selectedField}
                onClick={() => {
                  const result = duplicateField(draft, selectedFieldId);
                  commit(result.definition, '項目を複製しました', result.fieldId);
                }}
              >
                複製
              </StudioButton>
              <StudioButton
                disabled={!selectedField}
                aria-label={`${selectedField?.label ?? '項目'}を上へ移動`}
                onClick={() =>
                  commit(moveField(draft, selectedFieldId, -1), '項目を上へ移動しました')
                }
              >
                ↑ 上へ
              </StudioButton>
              <StudioButton
                disabled={!selectedField}
                aria-label={`${selectedField?.label ?? '項目'}を下へ移動`}
                onClick={() =>
                  commit(moveField(draft, selectedFieldId, 1), '項目を下へ移動しました')
                }
              >
                ↓ 下へ
              </StudioButton>
              <StudioButton
                disabled={!selectedField}
                onClick={() => setDeleteTarget(selectedFieldId)}
              >
                削除
              </StudioButton>
            </div>
            <div className={styles.moveRow}>
              <LabeledSelect
                label="別セクションへ移動"
                value={moveTarget}
                onChange={(event) => setMoveTarget(event.target.value)}
              >
                {draft.sections.map((section) => (
                  <option key={section.section_id} value={section.section_id}>
                    {section.label}
                  </option>
                ))}
              </LabeledSelect>
              <StudioButton
                disabled={!selectedField || selectedSection?.section_id === moveTarget}
                onClick={() =>
                  commit(
                    moveFieldToSection(draft, selectedFieldId, moveTarget),
                    '別セクションへ移動しました',
                  )
                }
              >
                移動
              </StudioButton>
            </div>
          </div>
        </section>

        <section
          className={`${styles.pane} ${styles.previewPane} ${activePane === 'preview' ? styles.activePane : ''}`}
          aria-labelledby="preview-title"
        >
          <PaneHeader number="2" title="スマホプレビュー" id="preview-title" meta="390px" />
          <div className={styles.previewTools}>
            <LabeledSelect
              label="表示セクション"
              value={previewSection?.section_id ?? ''}
              onChange={(event) => setPreviewSectionId(event.target.value)}
            >
              {draft.sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  {section.label}
                </option>
              ))}
            </LabeledSelect>
            <div className={styles.modeSwitch} aria-label="プレビューモード">
              {(
                [
                  ['normal', '通常'],
                  ['error', 'エラー'],
                  ['scenario', 'シナリオ'],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={previewMode === mode}
                  onClick={() => {
                    setPreviewMode(mode);
                    if (mode === 'error') setValidationFocusId((value) => value + 1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {previewMode === 'scenario' && (
              <LabeledSelect
                label="代表シナリオ"
                value={scenarioId}
                onChange={(event) => applyScenario(event.target.value)}
              >
                <option value="">選択してください</option>
                {(draft.scenarios ?? []).map((scenario) => (
                  <option key={scenario.scenario_id} value={scenario.scenario_id}>
                    {scenario.name}
                  </option>
                ))}
              </LabeledSelect>
            )}
            {previewMode === 'scenario' && activeScenario && (
              <p
                className={missingExpectedFields.length ? styles.testError : styles.testSuccess}
                role="status"
              >
                {missingExpectedFields.length
                  ? `! 期待表示項目が非表示です: ${missingExpectedFields.join(', ')}`
                  : '✓ 期待表示項目をすべて確認できました'}
              </p>
            )}
          </div>
          <div className={styles.phone}>
            <div className={styles.phoneBar}>
              <span>Step 1 / {Math.max(draft.sections.length, 1)}</span>
              <span>技術検証</span>
            </div>
            <div className={styles.phoneBody}>
              <p className={styles.previewNotice}>仮想商品・合成データ専用</p>
              <h3>{previewSection?.label}</h3>
              {previewSection?.description && (
                <p className={styles.previewDescription}>{previewSection.description}</p>
              )}
              <ErrorSummary errors={previewErrors} focusRequestId={validationFocusId} />
              <div className={styles.previewFields}>
                {previewFields.map((field) => (
                  <RuntimeField
                    key={field.field_id}
                    field={field}
                    value={answers[field.field_id] ?? field.default_value ?? ''}
                    onChange={(value) =>
                      setAnswers((current) => ({ ...current, [field.field_id]: value }))
                    }
                    isRequired={isFieldRequired(field, draft.rules, answers)}
                    error={
                      previewMode === 'error' && field.field_id === selectedFieldId
                        ? previewError
                        : undefined
                    }
                  />
                ))}
                {!previewFields.length && (
                  <p className={styles.empty}>このセクションに表示項目はありません。</p>
                )}
              </div>
              <button type="button" className={styles.previewPrimary}>
                次へ
              </button>
            </div>
          </div>
        </section>
        <section
          className={`${styles.pane} ${activePane === 'settings' ? styles.activePane : ''}`}
          aria-labelledby="settings-title"
        >
          <PaneHeader number="3" title="項目設定" id="settings-title" />
          {!selectedField ? (
            <p className={styles.empty}>左の画面構成から項目を選択してください。</p>
          ) : (
            <SettingsPanel
              draft={draft}
              field={selectedField}
              sectionId={selectedSection?.section_id ?? ''}
              answers={answers}
              onAnswers={setAnswers}
              onCommit={commit}
              onPreviewError={() => {
                setPreviewMode('error');
                setPreviewSectionId(selectedSection?.section_id ?? previewSectionId);
                setValidationFocusId((value) => value + 1);
                setActivePane('preview');
              }}
            />
          )}
        </section>
      </main>

      <section className={styles.validationBar} aria-labelledby="validation-title">
        <div>
          <h2 id="validation-title">検証結果</h2>
          <strong className={errors.length ? styles.countError : ''}>
            エラー {errors.length}件
          </strong>
          <strong>警告 {warnings.length}件</strong>
        </div>
        <div className={styles.issueList}>
          {issues.slice(0, 8).map((issue, index) => (
            <button
              key={`${issue.code}-${index}`}
              type="button"
              onClick={() => issue.targetId && selectField(issue.targetId)}
              disabled={!issue.targetId}
            >
              {issue.severity === 'error' ? '! エラー' : '△ 警告'}: {issue.message}
            </button>
          ))}
          {!issues.length && <span>✓ Schema・参照・設定矛盾に問題はありません</span>}
        </div>
      </section>
      <p className={styles.liveStatus} role="status" aria-live="polite">
        {status}
      </p>

      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setDeleteTarget(null);
              if (event.key === 'Tab') {
                const first = cancelDeleteRef.current;
                const last = confirmDeleteRef.current;
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <h2 id="delete-title">項目を削除しますか？</h2>
            <p>
              「{findField(draft, deleteTarget)?.label}
              」と、その項目だけが参照する条件・グループ参照を削除します。
            </p>
            <div className={styles.dialogActions}>
              <button
                ref={cancelDeleteRef}
                type="button"
                className={styles.button}
                onClick={() => setDeleteTarget(null)}
              >
                キャンセル
              </button>
              <button
                ref={confirmDeleteRef}
                type="button"
                className={`${styles.button} ${styles.dangerButton}`}
                onClick={() => {
                  const next = deleteField(draft, deleteTarget);
                  setDeleteTarget(null);
                  commit(
                    next,
                    '項目を削除しました。Undoで復元できます',
                    next.sections[0]?.fields[0]?.field_id ?? '',
                  );
                }}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaneHeader({
  number,
  title,
  id,
  meta,
}: {
  number: string;
  title: string;
  id: string;
  meta?: string;
}) {
  return (
    <div className={styles.paneHeader}>
      <div>
        <span className={styles.stepBadge}>{number}</span>
        <h2 id={id}>{title}</h2>
      </div>
      {meta && <span>{meta}</span>}
    </div>
  );
}
