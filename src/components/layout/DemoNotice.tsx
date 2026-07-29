import styles from '../components.module.css';

export function DemoNotice() {
  return (
    <aside className={styles.demoNotice} aria-label="技術検証デモについて">
      <strong>本番利用できない技術検証デモです</strong>
      <p>
        仮想銀行・仮想商品を使っています。実際の申込み、審査、与信は行いません。実在する個人情報は入力しないでください。
      </p>
    </aside>
  );
}
