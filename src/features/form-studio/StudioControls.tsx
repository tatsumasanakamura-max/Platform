import type { ReactNode } from 'react';
import styles from './FormStudio.module.css';

export function StudioButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={styles.button} {...props}>
      {children}
    </button>
  );
}

export function LabeledInput({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={styles.settingField}>
      <span className={styles.settingLabel}>{label}</span>
      {hint && <span className={styles.settingHint}>{hint}</span>}
      <input className={styles.input} {...props} />
    </label>
  );
}

export function LabeledTextarea({
  label,
  hint,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className={styles.settingField}>
      <span className={styles.settingLabel}>{label}</span>
      {hint && <span className={styles.settingHint}>{hint}</span>}
      <textarea className={styles.textarea} {...props} />
    </label>
  );
}

export function LabeledSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className={styles.settingField}>
      <span className={styles.settingLabel}>{label}</span>
      <select className={styles.select} {...props}>
        {children}
      </select>
    </label>
  );
}
