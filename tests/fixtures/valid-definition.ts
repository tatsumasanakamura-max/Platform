import type { FormDefinition } from '../../src/domain/form-definition';

export const validDefinition: FormDefinition = {
  bank_id: 'virtual-bank',
  product_id: 'virtual-product',
  form_version: '0.0.1',
  sections: [
    {
      section_id: 'personal',
      label: '本人情報',
      fields: [
        {
          field_id: 'personal.status',
          type: 'enum',
          label: '状態',
          required: true,
          options: [{ value: 'ACTIVE', label: '有効' }],
          validators: [],
        },
      ],
    },
    { section_id: 'complete', label: '完了', fields: [] },
  ],
  rules: [],
  navigation: [
    { from_section_id: 'personal', default_next_section_id: 'complete' },
    { from_section_id: 'complete', terminal: true },
  ],
};
