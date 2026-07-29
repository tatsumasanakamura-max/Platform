import type { ComponentProps } from 'react';
import { TextField } from './TextField';

export function NumberField(props: Omit<ComponentProps<typeof TextField>, 'type'>) {
  return <TextField {...props} type="text" inputMode="numeric" />;
}
