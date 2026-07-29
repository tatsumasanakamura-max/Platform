import { Button, type ButtonProps } from 'react-aria-components';
import styles from '../components.module.css';

interface ActionButtonProps extends ButtonProps {
  isPending?: boolean;
}

export function PrimaryButton({ children, isPending, ...props }: ActionButtonProps) {
  return (
    <Button
      {...props}
      isDisabled={props.isDisabled || isPending}
      className={`${styles.button} ${styles.primaryButton}`}
    >
      {isPending ? '処理しています…' : children}
    </Button>
  );
}

export function SecondaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button {...props} className={`${styles.button} ${styles.secondaryButton}`}>
      {children}
    </Button>
  );
}
