import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import definitionJson from '../definitions/virtual-bank-basic.json';
import { buildSubmissionPayload } from '../domain/answers';
import type { FormDefinition } from '../domain/form-definition';
import { validateFormDefinition } from '../domain/validate-definition';
import { AppHeader } from '../components/layout/AppHeader';
import { DemoNotice } from '../components/layout/DemoNotice';
import { SectionHeading } from '../components/layout/SectionHeading';
import { ProgressHeader } from '../components/progress/ProgressHeader';
import { PrimaryButton, SecondaryButton } from '../components/buttons/Buttons';
import { ConfirmationCard } from '../components/confirmation/ConfirmationCard';
import { CompletionPanel } from '../components/completion/CompletionPanel';
import {
  ApplicationForm,
  type ApplicationValues,
} from '../features/application-form/ApplicationForm';
import { toAnswers } from '../features/application-form/form-state';
import { FormStudio } from '../features/form-studio/FormStudio';
import { submitApplicationStub } from '../stubs/application-api';
import styles from './App.module.css';

type Screen = 'start' | 'personal' | 'confirmation' | 'complete';
const definition = definitionJson as FormDefinition;
const definitionIssues = validateFormDefinition(definition);
if (definitionIssues.length > 0)
  throw new Error(`Invalid bundled form definition: ${JSON.stringify(definitionIssues)}`);

export function App() {
  if (window.location.pathname.startsWith('/studio'))
    return <FormStudio initialDefinition={definition} />;
  return <ApplicationExperience />;
}

function isScreen(value: unknown): value is Screen {
  return ['start', 'personal', 'confirmation', 'complete'].includes(String(value));
}

function ApplicationExperience() {
  const [screen, setScreen] = useState<Screen>('start');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ApplicationValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    shouldFocusError: false,
    shouldUnregister: false,
    defaultValues: {},
  });
  const personalSection = definition.sections.find((section) => section.section_id === 'personal');
  if (!personalSection) throw new Error('personal section is missing');
  const personalFields = personalSection.fields;
  const answers = toAnswers(form.getValues(), personalFields);
  const payload = useMemo(() => buildSubmissionPayload(definition, answers), [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.history.replaceState({ screen: 'start' }, '');
    const onPopState = (event: PopStateEvent) => {
      if (isScreen(event.state?.screen)) setScreen(event.state.screen);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(next: Screen, replace = false) {
    if (replace) window.history.replaceState({ screen: next }, '');
    else window.history.pushState({ screen: next }, '');
    setScreen(next);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  async function submit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitApplicationStub(
        buildSubmissionPayload(definition, toAnswers(form.getValues(), personalFields)),
      );
      navigate('complete');
    } finally {
      setIsSubmitting(false);
    }
  }
  function restart() {
    form.reset();
    navigate('start', true);
  }

  return (
    <div className={styles.app}>
      <AppHeader />
      <main className={styles.main}>
        <div className={styles.shell}>
          <DemoNotice />
          {screen === 'start' && (
            <section className={styles.introCard}>
              <SectionHeading
                title="カードローン申込フォーム技術検証"
                description="バーチャルバンク Calmの仮想カードローンを題材に、入力体験とAI Native開発方式を確認するデモです。"
              />
              <ul className={styles.introList}>
                <li>この操作は実際の申込みになりません。</li>
                <li>実審査・実与信や金融機関への送信は行いません。</li>
                <li>入力には架空の合成データだけを使ってください。</li>
                <li>入力内容は公開環境へ永続保存しません。</li>
              </ul>
              <PrimaryButton onPress={() => navigate('personal')}>
                内容を理解してデモを始める
              </PrimaryButton>
              <a className={styles.studioLink} href="/studio">
                フォーム要件定義スタジオを開く
              </a>
            </section>
          )}
          {screen === 'personal' && (
            <>
              <ProgressHeader current={1} total={6} label="本人情報について" />
              <ApplicationForm
                definition={definition}
                form={form}
                onValid={() => navigate('confirmation')}
                onBack={() => navigate('start')}
              />
            </>
          )}
          {screen === 'confirmation' && (
            <>
              <ProgressHeader current={5} total={6} label="入力内容の確認" />
              <SectionHeading
                title="入力内容を確認してください"
                description="これは合成データです。実在人物の情報が含まれていないことも確認してください。"
              />
              <ConfirmationCard fields={personalFields} answers={payload} />
              <div className={styles.actions}>
                <PrimaryButton onPress={submit} isPending={isSubmitting}>
                  APIスタブへ送信する
                </PrimaryButton>
                {isSubmitting && (
                  <p className={styles.submissionStatus} role="status" aria-live="polite">
                    合成データをAPIスタブで確認しています
                  </p>
                )}
                <SecondaryButton onPress={() => navigate('personal')} isDisabled={isSubmitting}>
                  入力内容を修正する
                </SecondaryButton>
              </div>
            </>
          )}
          {screen === 'complete' && (
            <>
              <ProgressHeader current={6} total={6} label="完了" />
              <CompletionPanel />
              <SecondaryButton onPress={restart}>最初から確認する</SecondaryButton>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
