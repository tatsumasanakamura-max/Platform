export const conditionOperators = [
  'equals',
  'notEquals',
  'in',
  'exists',
  'greaterThanOrEqual',
  'lessThanOrEqual',
  'and',
  'or',
  'not',
] as const;

export type ConditionOperator = (typeof conditionOperators)[number];
export type ScalarValue = string | number | boolean | null;

export type Condition =
  | {
      op: Exclude<ConditionOperator, 'and' | 'or' | 'not'>;
      field: string;
      value?: ScalarValue | ScalarValue[];
    }
  | { op: 'and' | 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition };

export const ruleTypes = ['visibility', 'required', 'validation', 'navigation'] as const;
export type RuleType = (typeof ruleTypes)[number];

export interface RuleDefinition {
  rule_id: string;
  type: RuleType;
  condition: Condition;
  result?: {
    value?: boolean;
    error_code?: string;
    next_section_id?: string;
  };
}

export const validatorTypes = [
  'minLength',
  'maxLength',
  'minValue',
  'maxValue',
  'email',
  'postalCodeJP',
  'phoneJP',
  'katakana',
  'date',
] as const;

export type ValidatorType = (typeof validatorTypes)[number];

export interface ValidatorDefinition {
  type: ValidatorType;
  value?: number;
  error_code: string;
}

export type ValidationTiming = 'onBlur' | 'onSectionNext' | 'onSubmit';
export type FieldType = 'string' | 'integer' | 'decimal' | 'boolean' | 'date' | 'enum';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  field_id: string;
  type: FieldType;
  label: string;
  description?: string;
  autocomplete?: string;
  input_mode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
  required: boolean;
  visible?: boolean;
  required_rule_id?: string;
  visibility_rule_id?: string;
  validation_rule_ids?: string[];
  validators?: ValidatorDefinition[];
  validation_timing?: ValidationTiming[];
  options?: FieldOption[];
}

export interface SectionDefinition {
  section_id: string;
  label: string;
  description?: string;
  fields: FieldDefinition[];
}

export interface NavigationDefinition {
  from_section_id: string;
  default_next_section_id?: string;
  navigation_rule_ids?: string[];
  terminal?: boolean;
}

export interface FormDefinition {
  bank_id: string;
  product_id: string;
  form_version: string;
  sections: SectionDefinition[];
  rules: RuleDefinition[];
  navigation: NavigationDefinition[];
}
