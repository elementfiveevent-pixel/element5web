import { useState, useCallback } from "react";
import { Eye, FileText, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import FormFieldItem from "./FormFieldItem";
import FieldTypePicker from "./FieldTypePicker";
import FormPreview from "./FormPreview";
import type { FormFieldInput, FormFieldType } from "@/services/eventFormService";

export interface FormBuilderField extends FormFieldInput {
  tempId: string;
}

interface FormBuilderProps {
  fields: FormBuilderField[];
  onChange: (fields: FormBuilderField[]) => void;
  eventTitle?: string;
}

const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const FormBuilder = ({ fields, onChange, eventTitle }: FormBuilderProps) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addField = useCallback((type: FormFieldType) => {
    const defaultOptions = ['select', 'radio', 'checkbox'].includes(type)
      ? [{ label: 'Option 1', value: 'option_1' }]
      : undefined;

    const newField: FormBuilderField = {
      tempId: generateTempId(),
      field_type: type,
      label: '',
      description: undefined,
      placeholder: undefined,
      is_required: false,
      field_order: fields.length,
      options: defaultOptions,
      validation_rules: undefined,
      conditional_logic: undefined,
    };

    onChange([...fields, newField]);
  }, [fields, onChange]);

  const updateField = useCallback((tempId: string, updates: Partial<FormFieldInput>) => {
    onChange(
      fields.map(f => f.tempId === tempId ? { ...f, ...updates } : f)
    );
  }, [fields, onChange]);

  const deleteField = useCallback((tempId: string) => {
    onChange(fields.filter(f => f.tempId !== tempId));
  }, [fields, onChange]);

  const moveField = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= fields.length) return;

    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    
    // Update field_order values
    const updatedFields = newFields.map((f, i) => ({ ...f, field_order: i }));
    onChange(updatedFields);
  }, [fields, onChange]);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);
    
    // Update field_order values
    const updatedFields = newFields.map((f, i) => ({ ...f, field_order: i }));
    onChange(updatedFields);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, fields, onChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 shrink-0" />
              <span className="truncate">Registration Form Builder</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Create custom fields for event registration
            </CardDescription>
          </div>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")} className="shrink-0">
            <TabsList className="h-9">
              <TabsTrigger value="edit" className="text-sm px-3">Edit</TabsTrigger>
              <TabsTrigger value="preview" className="text-sm px-3">
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-4">
        {activeTab === "edit" ? (
          <div className="space-y-4">
            {/* Info about Quick Register behavior */}
            {fields.length > 0 && (
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
                <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                  <strong>Note:</strong> Adding custom fields will disable "Quick Register" for this event. 
                  Attendees will need to fill out the complete form.
                </AlertDescription>
              </Alert>
            )}

            {/* Field List */}
            {fields.length === 0 ? (
              <div className="text-center py-8 sm:py-12 border-2 border-dashed rounded-xl">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-2 text-sm sm:text-base">No custom fields yet</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 px-4">
                  Add fields to collect additional information
                </p>
                <FieldTypePicker onSelect={addField} />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Drag hint for mobile */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                  <GripVertical className="w-4 h-4" />
                  <span>Drag to reorder or use arrows</span>
                </div>
                
                {/* Fields list - no max-height to prevent clipping */}
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <FormFieldItem
                      key={field.tempId}
                      field={field}
                      index={index}
                      onUpdate={updateField}
                      onDelete={deleteField}
                      onMoveUp={() => moveField(index, 'up')}
                      onMoveDown={() => moveField(index, 'down')}
                      isFirst={index === 0}
                      isLast={index === fields.length - 1}
                      isDragging={draggedIndex === index}
                      isDragOver={dragOverIndex === index}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add Field Button */}
            {fields.length > 0 && (
              <div className="flex justify-center pt-4 border-t">
                <FieldTypePicker onSelect={addField} />
              </div>
            )}

            {/* Info text */}
            <p className="text-xs text-muted-foreground text-center px-2">
              Basic fields (Name, Email, College) are collected automatically.
            </p>
          </div>
        ) : (
          <FormPreview fields={fields} eventTitle={eventTitle} />
        )}
      </CardContent>
    </Card>
  );
};

export default FormBuilder;