import type { FormDefinition } from '../../domain/form-definition';
import { validateFormDefinition } from '../../domain/validate-definition';

export const STUDIO_STORAGE_KEY = 'poc.form-studio.virtual-product.draft.v1';

export function saveDraft(storage: Pick<Storage, 'setItem'>, definition: FormDefinition): void {
  storage.setItem(STUDIO_STORAGE_KEY, JSON.stringify(definition));
}

export function loadDraft(storage: Pick<Storage, 'getItem'>): FormDefinition | null {
  const stored = storage.getItem(STUDIO_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed: unknown = JSON.parse(stored);
    return validateFormDefinition(parsed).length === 0 ? (parsed as FormDefinition) : null;
  } catch {
    return null;
  }
}
