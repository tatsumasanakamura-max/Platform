import { Checkbox } from 'react-aria-components';
import styles from '../components.module.css';

interface CheckboxFieldProps {
  children: string;
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  isInvalid?: boolean;
}

export function CheckboxField({ children, isSelected, onChange, isInvalid }: CheckboxFieldProps) {
  return (
    <Checkbox
      isSelected={isSelected}
      onChange={onChange}
      isInvalid={isInvalid}
      className={styles.checkbox}
    >
      <span className={styles.checkboxBox} aria-hidden="true">
        ✓
      </span>
      <span>{children}</span>
    </Checkbox>
  );
}
