import styles from '../components.module.css';

export function AppHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.headerInner}>
        <p className={styles.brand}>バーチャルバンク Calm</p>
      </div>
    </header>
  );
}
