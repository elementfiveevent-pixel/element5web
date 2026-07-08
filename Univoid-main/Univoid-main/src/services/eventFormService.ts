import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type FormFieldType = 
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file';

export interface FieldOption {
  label: string;
  value: string;
}

export interface ValidationRules {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
}

export interface ConditionalLogic {
  showWhen?: {
    fieldId: string;
    operator: 'equals' | 'notEquals' | 'contains';
    value: string;
  };
}

export interface FormField {
  id: string;
  event_id: string;
  field_type: FormFieldType;
  label: string;
  description: string | null;
  placeholder: string | null;
  is_required: boolean;
  field_order: number;
  options: FieldOption[] | null;
  validation_rules: ValidationRules | null;
  conditional_logic: ConditionalLogic | null;
  created_at: string;
  updated_at: string;
}

export interface FormFieldInput {
  field_type: FormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  is_required?: boolean;
  field_order: number;
  options?: FieldOption[];
  validation_rules?: ValidationRules;
  conditional_logic?: ConditionalLogic;
}

export interface FormTemplate {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  fields: FormFieldInput[];
  created_at: string;
  updated_at: string;
}

// Fetch form fields for an event
export async function fetchEventFormFields(eventId: string): Promise<FormField[]> {
  const { data, error } = await supabase
    .from('event_form_fields')
    .select('*')
    .eq('event_id', eventId)
    .order('field_order', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(field => ({
    ...field,
    options: field.options as unknown as FieldOption[] | null,
    validation_rules: field.validation_rules as unknown as ValidationRules | null,
    conditional_logic: field.conditional_logic as unknown as ConditionalLogic | null,
  }));
}

// Create a single form field
export async function createFormField(
  eventId: string, 
  field: FormFieldInput
): Promise<FormField> {
  const { data, error } = await supabase
    .from('event_form_fields')
    .insert({
      event_id: eventId,
      field_type: field.field_type,
      label: field.label,
      description: field.description || null,
      placeholder: field.placeholder || null,
      is_required: field.is_required ?? false,
      field_order: field.field_order,
      options: field.options as unknown as Json,
      validation_rules: field.validation_rules as unknown as Json,
      conditional_logic: field.conditional_logic as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    options: data.options as unknown as FieldOption[] | null,
    validation_rules: data.validation_rules as unknown as ValidationRules | null,
    conditional_logic: data.conditional_logic as unknown as ConditionalLogic | null,
  };
}

// Create multiple form fields at once
export async function createFormFields(
  eventId: string,
  fields: FormFieldInput[]
): Promise<FormField[]> {
  if (fields.length === 0) return [];

  const insertData = fields.map(field => ({
    event_id: eventId,
    field_type: field.field_type,
    label: field.label,
    description: field.description || null,
    placeholder: field.placeholder || null,
    is_required: field.is_required ?? false,
    field_order: field.field_order,
    options: field.options as unknown as Json,
    validation_rules: field.validation_rules as unknown as Json,
    conditional_logic: field.conditional_logic as unknown as Json,
  }));

  const { data, error } = await supabase
    .from('event_form_fields')
    .insert(insertData)
    .select();

  if (error) throw error;
  
  return (data || []).map(field => ({
    ...field,
    options: field.options as unknown as FieldOption[] | null,
    validation_rules: field.validation_rules as unknown as ValidationRules | null,
    conditional_logic: field.conditional_logic as unknown as ConditionalLogic | null,
  }));
}

// Delete a form field
export async function deleteFormField(fieldId: string): Promise<void> {
  const { error } = await supabase
    .from('event_form_fields')
    .delete()
    .eq('id', fieldId);

  if (error) throw error;
}

// Delete all form fields for an event
export async function deleteEventFormFields(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('event_form_fields')
    .delete()
    .eq('event_id', eventId);

  if (error) throw error;
}

// Reorder form fields
export async function reorderFormFields(
  eventId: string,
  fieldOrders: { id: string; order: number }[]
): Promise<void> {
  // Update each field's order in parallel
  const updates = fieldOrders.map(({ id, order }) =>
    supabase
      .from('event_form_fields')
      .update({ field_order: order })
      .eq('id', id)
      .eq('event_id', eventId)
  );

  const results = await Promise.all(updates);
  const errors = results.filter(r => r.error);
  if (errors.length > 0) {
    throw errors[0].error;
  }
}

// Form Templates
export async function fetchFormTemplates(): Promise<FormTemplate[]> {
  const { data, error } = await supabase
    .from('event_form_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(template => ({
    ...template,
    fields: (template.fields as unknown as FormFieldInput[]) || [],
  }));
}

export async function createFormTemplate(
  name: string,
  description: string | null,
  fields: FormFieldInput[],
  organizerId: string
): Promise<FormTemplate> {
  const { data, error } = await supabase
    .from('event_form_templates')
    .insert({
      organizer_id: organizerId,
      name,
      description,
      fields: fields as unknown as Json,
    })
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    fields: (data.fields as unknown as FormFieldInput[]) || [],
  };
}

export async function deleteFormTemplate(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('event_form_templates')
    .delete()
    .eq('id', templateId);

  if (error) throw error;
}

// Field type metadata for UI
export const FIELD_TYPES: { type: FormFieldType; label: string; icon: string; description: string }[] = [
  { type: 'text', label: 'Short Text', icon: 'Type', description: 'Single line text input' },
  { type: 'textarea', label: 'Long Text', icon: 'AlignLeft', description: 'Multi-line text area' },
  { type: 'email', label: 'Email', icon: 'Mail', description: 'Email address input' },
  { type: 'phone', label: 'Phone', icon: 'Phone', description: 'Phone number input' },
  { type: 'number', label: 'Number', icon: 'Hash', description: 'Numeric input' },
  { type: 'date', label: 'Date', icon: 'Calendar', description: 'Date picker' },
  { type: 'time', label: 'Time', icon: 'Clock', description: 'Time picker' },
  { type: 'datetime', label: 'Date & Time', icon: 'CalendarClock', description: 'Date and time picker' },
  { type: 'select', label: 'Dropdown', icon: 'ChevronDown', description: 'Single selection dropdown' },
  { type: 'radio', label: 'Radio Buttons', icon: 'Circle', description: 'Single choice from options' },
  { type: 'checkbox', label: 'Checkboxes', icon: 'CheckSquare', description: 'Multiple choice selection' },
  { type: 'file', label: 'File Upload', icon: 'Upload', description: 'File attachment' },
];
