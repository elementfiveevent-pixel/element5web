import { useState } from "react";
import { GripVertical, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FormFieldInput } from "@/services/eventFormService";
import { FIELD_TYPES } from "@/services/eventFormService";

interface FormFieldItemProps {
  field: FormFieldInput & { tempId: string };
  index: number;
  onUpdate: (tempId: string, updates: Partial<FormFieldInput>) => void;
  onDelete: (tempId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
  // Drag and drop props
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

const FormFieldItem = ({
  field,
  index,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: FormFieldItemProps) => {
  const fieldMeta = FIELD_TYPES.find(f => f.type === field.field_type);
  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.field_type);

  const handleOptionChange = (optIndex: number, key: 'label' | 'value', value: string) => {
    const options = [...(field.options || [])];
    options[optIndex] = { ...options[optIndex], [key]: value };
    onUpdate(field.tempId, { options });
  };

  const addOption = () => {
    const options = [...(field.options || [])];
    options.push({ label: `Option ${options.length + 1}`, value: `option_${options.length + 1}` });
    onUpdate(field.tempId, { options });
  };

  const removeOption = (optIndex: number) => {
    const options = [...(field.options || [])];
    options.splice(optIndex, 1);
    onUpdate(field.tempId, { options });
  };

  return (
    <Card 
      className={`transition-all duration-200 touch-manipulation ${
        isDragging ? 'opacity-50 scale-[0.98] ring-2 ring-primary' : ''
      } ${
        isDragOver ? 'ring-2 ring-primary ring-offset-2 bg-primary/5' : ''
      }`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', field.tempId);
        onDragStart?.();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        onDragOver?.(e);
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Mobile-first header with drag handle */}
      <div className="flex items-center gap-2 p-3 border-b bg-muted/30">
        {/* Drag Handle - prominent on mobile */}
        <div 
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted cursor-grab active:cursor-grabbing touch-manipulation shrink-0"
          onTouchStart={(e) => {
            // Touch-friendly drag initiation hint
            e.currentTarget.classList.add('bg-primary/20');
          }}
          onTouchEnd={(e) => {
            e.currentTarget.classList.remove('bg-primary/20');
          }}
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Field Type Badge */}
        <Badge variant="secondary" className="shrink-0 text-xs">
          {fieldMeta?.label || field.field_type}
        </Badge>

        {/* Reorder buttons for mobile */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMoveUp(index)}
            disabled={isFirst}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onMoveDown(index)}
            disabled={isLast}
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(field.tempId)}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3 space-y-3">
        {/* Label Input - always visible */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Field Label</Label>
            <Input
              value={field.label}
              onChange={(e) => onUpdate(field.tempId, { label: e.target.value })}
              placeholder="Enter field label..."
              className="h-10"
            />
          </div>
          <div className="flex items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg bg-muted/50">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Required</Label>
              <Switch
                checked={field.is_required}
                onCheckedChange={(checked) => onUpdate(field.tempId, { is_required: checked })}
              />
            </div>
          </div>
        </div>

        {/* Expandable Settings in Accordion */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="settings" className="border rounded-lg">
            <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
              <span className="text-muted-foreground">Advanced Settings</span>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
              {/* Description / Help Text */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Help Text</Label>
                <Textarea
                  value={field.description || ""}
                  onChange={(e) => onUpdate(field.tempId, { description: e.target.value })}
                  placeholder="Additional instructions for this field"
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Placeholder */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Placeholder</Label>
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => onUpdate(field.tempId, { placeholder: e.target.value })}
                  placeholder="Placeholder text shown in the input"
                />
              </div>

              {/* Options for select/radio/checkbox */}
              {hasOptions && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Options</Label>
                  <div className="space-y-2">
                    {(field.options || []).map((option, optIndex) => (
                      <div key={optIndex} className="flex flex-col sm:flex-row gap-2">
                        <Input
                          value={option.label}
                          onChange={(e) => handleOptionChange(optIndex, 'label', e.target.value)}
                          placeholder="Display label"
                          className="flex-1"
                        />
                        <Input
                          value={option.value}
                          onChange={(e) => handleOptionChange(optIndex, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 sm:max-w-[140px]"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(optIndex)}
                          disabled={field.options?.length === 1}
                          className="shrink-0 h-10 w-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addOption} className="w-full sm:w-auto">
                      + Add Option
                    </Button>
                  </div>
                </div>
              )}

              {/* Validation Rules */}
              {['text', 'textarea', 'number'].includes(field.field_type) && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Validation</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {field.field_type === 'number' ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Min Value</Label>
                          <Input
                            type="number"
                            value={field.validation_rules?.min ?? ""}
                            onChange={(e) => onUpdate(field.tempId, {
                              validation_rules: {
                                ...field.validation_rules,
                                min: e.target.value ? parseInt(e.target.value) : undefined,
                              }
                            })}
                            placeholder="Min"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Value</Label>
                          <Input
                            type="number"
                            value={field.validation_rules?.max ?? ""}
                            onChange={(e) => onUpdate(field.tempId, {
                              validation_rules: {
                                ...field.validation_rules,
                                max: e.target.value ? parseInt(e.target.value) : undefined,
                              }
                            })}
                            placeholder="Max"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Min Length</Label>
                          <Input
                            type="number"
                            value={field.validation_rules?.minLength ?? ""}
                            onChange={(e) => onUpdate(field.tempId, {
                              validation_rules: {
                                ...field.validation_rules,
                                minLength: e.target.value ? parseInt(e.target.value) : undefined,
                              }
                            })}
                            placeholder="Min"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Max Length</Label>
                          <Input
                            type="number"
                            value={field.validation_rules?.maxLength ?? ""}
                            onChange={(e) => onUpdate(field.tempId, {
                              validation_rules: {
                                ...field.validation_rules,
                                maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                              }
                            })}
                            placeholder="Max"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </Card>
  );
};

export default FormFieldItem;