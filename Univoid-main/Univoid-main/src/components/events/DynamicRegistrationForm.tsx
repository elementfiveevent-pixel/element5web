import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, AlertCircle } from "lucide-react";
import { fetchEventFormFields, type FormField } from "@/services/eventFormService";
import { supabase } from "@/integrations/supabase/client";
import { validateFileUpload } from "@/lib/fileValidation";

interface DynamicRegistrationFormProps {
  eventId: string;
  onSubmit: (customData: Record<string, unknown>) => void;
  isSubmitting: boolean;
  isPaidEvent: boolean;
  paymentSection?: React.ReactNode;
  termsSection?: React.ReactNode;
  submitDisabled?: boolean;
  submitLabel?: string;
}

interface FieldValue {
  value: unknown;
  error: string | null;
}

const DynamicRegistrationForm = ({
  eventId,
  onSubmit,
  isSubmitting,
  isPaidEvent,
  paymentSection,
  termsSection,
  submitDisabled = false,
  submitLabel = "Submit Registration",
}: DynamicRegistrationFormProps) => {
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({});

  const { data: formFields, isLoading } = useQuery({
    queryKey: ["event-form-fields", eventId],
    queryFn: () => fetchEventFormFields(eventId),
    staleTime: 10 * 60 * 1000,
  });

  // Initialize field values when fields load
  useEffect(() => {
    if (formFields) {
      const initialValues: Record<string, FieldValue> = {};
      formFields.forEach(field => {
        initialValues[field.id] = {
          value: field.field_type === 'checkbox' ? [] : '',
          error: null,
        };
      });
      setFieldValues(initialValues);
    }
  }, [formFields]);

  const updateFieldValue = (fieldId: string, value: unknown) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: { value, error: null },
    }));
  };

  const validateField = (field: FormField, value: unknown): string | null => {
    // Required check
    if (field.is_required) {
      if (value === '' || value === null || value === undefined) {
        return `${field.label} is required`;
      }
      if (Array.isArray(value) && value.length === 0) {
        return `Please select at least one option for ${field.label}`;
      }
    }

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null; // Not required and empty, so valid
    }

    const rules = field.validation_rules;
    if (!rules) return null;

    const strValue = String(value);

    // Length validation
    if (rules.minLength && strValue.length < rules.minLength) {
      return `${field.label} must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && strValue.length > rules.maxLength) {
      return `${field.label} must be at most ${rules.maxLength} characters`;
    }

    // Number validation
    if (field.field_type === 'number') {
      const numValue = Number(value);
      if (rules.min !== undefined && numValue < rules.min) {
        return `${field.label} must be at least ${rules.min}`;
      }
      if (rules.max !== undefined && numValue > rules.max) {
        return `${field.label} must be at most ${rules.max}`;
      }
    }

    // Email validation
    if (field.field_type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(strValue)) {
        return 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (field.field_type === 'phone') {
      const phoneRegex = /^[\d\s+\-()]{10,}$/;
      if (!phoneRegex.test(strValue)) {
        return 'Please enter a valid phone number';
      }
    }

    // Pattern validation
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(strValue)) {
          return rules.patternMessage || `${field.label} format is invalid`;
        }
      } catch {
        // Invalid regex, skip validation
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    // If no custom fields exist, just call onSubmit directly
    if (!formFields || formFields.length === 0) {
      onSubmit({});
      return;
    }

    // Validate all fields
    let hasErrors = false;
    const newFieldValues = { ...fieldValues };

    for (const field of formFields) {
      const error = validateField(field, fieldValues[field.id]?.value);
      newFieldValues[field.id] = {
        ...newFieldValues[field.id],
        error,
      };
      if (error) hasErrors = true;
    }

    setFieldValues(newFieldValues);

    if (hasErrors) return;

    // Build custom data object
    const customData: Record<string, unknown> = {};
    for (const field of formFields) {
      const value = fieldValues[field.id]?.value;
      
      // Handle file uploads
      if (field.field_type === 'file' && fileUploads[field.id]) {
        const file = fileUploads[field.id]!;
        const ext = file.name.split('.').pop();
        const path = `custom-uploads/${eventId}/${field.id}/${Date.now()}.${ext}`;
        
        const { error } = await supabase.storage
          .from('event-assets')
          .upload(path, file);
        
        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('event-assets')
            .getPublicUrl(path);
          customData[field.label] = publicUrl;
        }
      } else {
        customData[field.label] = value;
      }
    }

    onSubmit(customData);
  };

  const renderField = (field: FormField) => {
    const fieldState = fieldValues[field.id] || { value: '', error: null };
    const { value, error } = fieldState;

    const commonProps = {
      id: field.id,
      'aria-invalid': !!error,
      'aria-describedby': error ? `${field.id}-error` : undefined,
    };

    const isFullWidth = ['textarea', 'file', 'checkbox', 'radio'].includes(field.field_type);

    return (
      <div key={field.id} className={`space-y-2 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
        <Label htmlFor={field.id} className="flex items-center gap-1">
          {field.label}
          {field.is_required && <span className="text-destructive">*</span>}
        </Label>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}

        {field.field_type === 'text' && (
          <Input
            {...commonProps}
            type="text"
            placeholder={field.placeholder || ''}
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'textarea' && (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder || ''}
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            rows={3}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'email' && (
          <Input
            {...commonProps}
            type="email"
            placeholder={field.placeholder || 'email@example.com'}
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'phone' && (
          <Input
            {...commonProps}
            type="tel"
            placeholder={field.placeholder || '+91 XXXXX XXXXX'}
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'number' && (
          <Input
            {...commonProps}
            type="number"
            placeholder={field.placeholder || '0'}
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            min={field.validation_rules?.min}
            max={field.validation_rules?.max}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'date' && (
          <Input
            {...commonProps}
            type="date"
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'time' && (
          <Input
            {...commonProps}
            type="time"
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'datetime' && (
          <Input
            {...commonProps}
            type="datetime-local"
            value={value as string}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            className={error ? 'border-destructive' : ''}
          />
        )}

        {field.field_type === 'select' && (
          <Select
            value={value as string}
            onValueChange={(v) => updateFieldValue(field.id, v)}
          >
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt, i) => (
                <SelectItem key={i} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.field_type === 'radio' && (
          <RadioGroup
            value={value as string}
            onValueChange={(v) => updateFieldValue(field.id, v)}
            className={error ? 'border border-destructive rounded-md p-2' : ''}
          >
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${field.id}_${i}`} />
                <Label htmlFor={`${field.id}_${i}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.field_type === 'checkbox' && (
          <div className={`space-y-2 ${error ? 'border border-destructive rounded-md p-2' : ''}`}>
            {(field.options || []).map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}_${i}`}
                  checked={(value as string[])?.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = (value as string[]) || [];
                    if (checked) {
                      updateFieldValue(field.id, [...currentValues, opt.value]);
                    } else {
                      updateFieldValue(field.id, currentValues.filter(v => v !== opt.value));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}_${i}`} className="font-normal cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {field.field_type === 'file' && (
          <div className={`border-2 border-dashed rounded-xl p-4 text-center ${error ? 'border-destructive' : ''}`}>
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  const validationError = validateFileUpload(file, 'any');
                  if (validationError) {
                    updateFieldValue(field.id, '');
                    setFieldValues(prev => ({
                      ...prev,
                      [field.id]: { value: '', error: validationError }
                    }));
                    return;
                  }
                }
                setFileUploads(prev => ({ ...prev, [field.id]: file }));
                updateFieldValue(field.id, file?.name || '');
                // Clear any previous error
                setFieldValues(prev => ({
                  ...prev,
                  [field.id]: { value: file?.name || '', error: null }
                }));
              }}
              className="hidden"
              id={`file-${field.id}`}
            />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {fileUploads[field.id]?.name || 'Click to upload'}
              </span>
            </label>
          </div>
        )}

        {error && (
          <p id={`${field.id}-error`} className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const hasCustomFields = formFields && formFields.length > 0;

  return (
    <div className="space-y-4">
      {/* Custom form fields */}
      {hasCustomFields && (
        <div className="space-y-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            A Few More Details
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {formFields.map(renderField)}
          </div>
        </div>
      )}

      {/* Payment section (passed from parent) */}
      {isPaidEvent && paymentSection}

      {/* Terms section (passed from parent) */}
      {termsSection}

      {/* Submit button */}
      <Button
        className="w-full rounded-full"
        onClick={handleSubmit}
        disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? "Submitting..." : submitLabel}
      </Button>
    </div>
  );
};

export default DynamicRegistrationForm;
