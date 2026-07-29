import { Text } from 'react-aria-components';
import styles from '../components.module.css';

export function InlineHelp({ children }: { children: string }) {
  return (
    <Text slot="description" className={styles.description}>
      {children}
    </Text>
  );
}
