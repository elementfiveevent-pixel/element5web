import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import {
  CATEGORY_GROUPS,
  TYPE_GROUPS,
  MAX_CATEGORIES,
  MAX_EVENT_TYPES,
  type CategoryGroup,
  type TypeGroup,
} from "@/constants/eventOptions";

interface MultiSelectPickerProps {
  type: "category" | "event_type";
  selected: string[];
  onChange: (values: string[]) => void;
}

export default function MultiSelectPicker({ type, selected, onChange }: MultiSelectPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isCategory = type === "category";
  const maxItems = isCategory ? MAX_CATEGORIES : MAX_EVENT_TYPES;
  const groups = isCategory ? CATEGORY_GROUPS : TYPE_GROUPS;
  const label = isCategory ? "Categories" : "Event Types";

  const toggleItem = (item: string) => {
    const lower = item.toLowerCase();
    if (selected.includes(lower)) {
      onChange(selected.filter(s => s !== lower));
    } else if (selected.length < maxItems) {
      onChange([...selected, lower]);
    }
  };

  const removeItem = (item: string) => {
    onChange(selected.filter(s => s !== item));
  };

  // Filter groups by search
  const filteredGroups = searchQuery
    ? groups.map(g => ({
        ...g,
        items: g.items.filter(i => i.toLowerCase().includes(searchQuery.toLowerCase())),
      })).filter(g => g.items.length > 0)
    : groups;

  return (
    <div className="space-y-2">
      <Label>{label} * <span className="text-muted-foreground text-xs font-normal">(select up to {maxItems})</span></Label>
      
      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(item => (
            <Badge key={item} variant="secondary" className="gap-1 capitalize">
              {item}
              <button onClick={() => removeItem(item)} className="ml-0.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between text-muted-foreground"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selected.length === 0 ? `Select ${label.toLowerCase()}...` : `${selected.length}/${maxItems} selected`}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="border rounded-lg bg-popover shadow-md">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            <div className="p-2 space-y-3">
              {filteredGroups.map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1.5">
                    {"emoji" in group ? `${(group as CategoryGroup).emoji} ` : ""}{group.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map(item => {
                      const isSelected = selected.includes(item.toLowerCase());
                      const isDisabled = !isSelected && selected.length >= maxItems;
                      return (
                        <button
                          key={item}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => toggleItem(item)}
                          className={`
                            inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border
                            ${isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : isDisabled
                                ? "bg-muted/50 text-muted-foreground/50 border-transparent cursor-not-allowed"
                                : "bg-muted hover:bg-accent text-foreground border-transparent hover:border-accent cursor-pointer"
                            }
                          `}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filteredGroups.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No matches found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
