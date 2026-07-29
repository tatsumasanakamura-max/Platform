import { useEffect, useRef } from 'react';
import styles from '../components.module.css';

export interface SummaryError {
  fieldId: string;
  message: string;
}

export function ErrorSummary({
  errors,
  focusRequestId = 0,
}: {
  errors: SummaryError[];
  focusRequestId?: number;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const handledFocusRequestRef = useRef(0);

  useEffect(() => {
    if (
      focusRequestId > 0 &&
      focusRequestId !== handledFocusRequestRef.current &&
      errors.length > 0
    ) {
      handledFocusRequestRef.current = focusRequestId;
      summaryRef.current?.focus();
    }
  }, [errors, focusRequestId]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={summaryRef}
      className={styles.errorSummary}
      role="alert"
      aria-labelledby="error-summary-title"
      tabIndex={-1}
    >
      <h2 id="error-summary-title">入力内容を確認してください</h2>
      <p>次の項目を修正すると先へ進めます。</p>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <button
              type="button"
              className={styles.errorLink}
              onClick={() => document.getElementsByName(error.fieldId)[0]?.focus()}
            >
              {error.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
