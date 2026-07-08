import { 
  Type, AlignLeft, Mail, Phone, Hash, Calendar, Clock, 
  ChevronDown, Circle, CheckSquare, Upload, CalendarClock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FormFieldType } from "@/services/eventFormService";
import { FIELD_TYPES } from "@/services/eventFormService";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  Calendar,
  Clock,
  CalendarClock,
  ChevronDown,
  Circle,
  CheckSquare,
  Upload,
};

interface FieldTypePickerProps {
  onSelect: (type: FormFieldType) => void;
}

const FieldTypePicker = ({ onSelect }: FieldTypePickerProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span>Add Field</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-64 max-h-[60vh] overflow-y-auto bg-popover z-50"
        sideOffset={4}
      >
        {FIELD_TYPES.map((fieldType) => {
          const IconComponent = iconMap[fieldType.icon] || Type;
          return (
            <DropdownMenuItem
              key={fieldType.type}
              onClick={() => onSelect(fieldType.type)}
              className="flex items-start gap-3 py-2"
            >
              <IconComponent className="w-5 h-5 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">{fieldType.label}</div>
                <div className="text-xs text-muted-foreground">{fieldType.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FieldTypePicker;
