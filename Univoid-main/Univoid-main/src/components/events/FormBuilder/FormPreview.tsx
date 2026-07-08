import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { FormBuilderField } from "./FormBuilder";

interface FormPreviewProps {
  fields: FormBuilderField[];
  eventTitle?: string;
}

const FormPreview = ({ fields, eventTitle }: FormPreviewProps) => {
  const renderField = (field: FormBuilderField) => {
    const { field_type, label, description, placeholder, is_required, options } = field;

    return (
      <div key={field.tempId} className="space-y-2">
        <Label className="flex items-center gap-1">
          {label || "Untitled Field"}
          {is_required && <span className="text-destructive">*</span>}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}

        {field_type === 'text' && (
          <Input placeholder={placeholder || ""} disabled />
        )}

        {field_type === 'textarea' && (
          <Textarea placeholder={placeholder || ""} disabled rows={3} />
        )}

        {field_type === 'email' && (
          <Input type="email" placeholder={placeholder || "email@example.com"} disabled />
        )}

        {field_type === 'phone' && (
          <Input type="tel" placeholder={placeholder || "+91 XXXXX XXXXX"} disabled />
        )}

        {field_type === 'number' && (
          <Input type="number" placeholder={placeholder || "0"} disabled />
        )}

        {field_type === 'date' && (
          <Input type="date" disabled />
        )}

        {field_type === 'time' && (
          <Input type="time" disabled />
        )}

        {field_type === 'datetime' && (
          <Input type="datetime-local" disabled />
        )}

        {field_type === 'select' && (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {(options || []).map((opt, i) => (
                <SelectItem key={i} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field_type === 'radio' && (
          <RadioGroup disabled>
            {(options || []).map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`${field.tempId}_${i}`} />
                <Label htmlFor={`${field.tempId}_${i}`} className="font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field_type === 'checkbox' && (
          <div className="space-y-2">
            {(options || []).map((opt, i) => (
              <div key={i} className="flex items-center space-x-2">
                <Checkbox id={`${field.tempId}_${i}`} disabled />
                <Label htmlFor={`${field.tempId}_${i}`} className="font-normal">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
        )}

        {field_type === 'file' && (
          <div className="border-2 border-dashed rounded-lg p-4 text-center text-muted-foreground">
            Click or drag to upload a file
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-2 border-primary/20 bg-muted/30">
      <CardHeader>
        <CardTitle>{eventTitle || "Event Registration"}</CardTitle>
        <CardDescription>Preview of your registration form</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Default fields that are always collected */}
        <div className="space-y-4 pb-4 border-b">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Default Fields (Always Collected)
          </p>
          <div className="space-y-2">
            <Label>Full Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Your full name" disabled />
          </div>
          <div className="space-y-2">
            <Label>Email <span className="text-destructive">*</span></Label>
            <Input type="email" placeholder="your.email@example.com" disabled />
          </div>
          <div className="space-y-2">
            <Label>College / University</Label>
            <Input placeholder="Your institution name" disabled />
          </div>
        </div>

        {/* Custom fields */}
        {fields.length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Custom Fields
            </p>
            {fields.map(renderField)}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No custom fields added yet
          </p>
        )}

        {/* Submit button preview */}
        <Button className="w-full" disabled>
          Register for Event
        </Button>
      </CardContent>
    </Card>
  );
};

export default FormPreview;
