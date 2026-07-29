import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select,
  SelectValue,
  type Key,
} from 'react-aria-components';
import type { FieldOption } from '../../domain/form-definition';
import styles from '../components.module.css';
import { FieldError } from './FieldError';
import { InlineHelp } from './InlineHelp';

interface SelectFieldProps {
  name: string;
  label: string;
  description?: string;
  error?: string;
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isRequired?: boolean;
  isInvalid?: boolean;
  options: FieldOption[];
}

export function SelectField({
  name,
  label,
  description,
  error,
  value,
  onChange,
  onBlur,
  isRequired,
  isInvalid,
  options,
}: SelectFieldProps) {
  return (
    <Select
      name={name}
      selectedKey={value ?? null}
      onSelectionChange={(key: Key | null) => key !== null && onChange(String(key))}
      onBlur={onBlur}
      isRequired={isRequired}
      isInvalid={isInvalid}
      className={styles.field}
      validationBehavior="aria"
    >
      <Label className={styles.label}>
        {label}
        {!isRequired && <span className={styles.optional}>任意</span>}
      </Label>
      {description && <InlineHelp>{description}</InlineHelp>}
      <Button className={styles.selectButton}>
        <SelectValue />
        <span aria-hidden="true">⌄</span>
      </Button>
      <FieldError>{error}</FieldError>
      <Popover className={styles.selectPopover}>
        <ListBox>
          {options.map((option) => (
            <ListBoxItem key={option.value} id={option.value} className={styles.selectItem}>
              {option.label}
            </ListBoxItem>
          ))}
        </ListBox>
      </Popover>
    </Select>
  );
}
