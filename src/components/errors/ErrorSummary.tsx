import { useEffect, useRef } from 'react';
import styles from '../components.module.css';

export interface SummaryError {
  fieldId: string;
  message: string;
}

export function ErrorSummary({
  errors,
  shouldFocus = false,
}: {
  errors: SummaryError[];
  shouldFocus?: boolean;
}) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldFocus && errors.length > 0) summaryRef.current?.focus();
  }, [errors, shouldFocus]);

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
