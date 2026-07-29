import styles from '../components.module.css';

interface ProgressHeaderProps {
  current: number;
  total: number;
  label: string;
}

export function ProgressHeader({ current, total, label }: ProgressHeaderProps) {
  const percentage = Math.round((current / total) * 100);
  return (
    <div className={styles.progress}>
      <div className={styles.progressMeta}>
        <span>
          ステップ {current} / {total}
        </span>
        <span>所要時間は検証後に更新</span>
      </div>
      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-label={`申込デモの進捗: ${label}`}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`${total}ステップ中${current}、${label}`}
      >
        <div className={styles.progressValue} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
