import styles from '../components.module.css';

export function CompletionPanel() {
  return (
    <section className={styles.completion} aria-labelledby="completion-title">
      <h1 id="completion-title">技術検証が完了しました</h1>
      <p>合成データはAPIスタブで受け付けました。実際の申込みや審査は行われていません。</p>
      <p>この画面を閉じても、金融機関から連絡が届くことはありません。</p>
    </section>
  );
}
