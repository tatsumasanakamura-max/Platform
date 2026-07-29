import { Text } from 'react-aria-components';
import styles from '../components.module.css';

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <Text slot="errorMessage" className={styles.fieldError}>
      <span aria-hidden="true">!</span>
      <span>{children}</span>
    </Text>
  );
}
