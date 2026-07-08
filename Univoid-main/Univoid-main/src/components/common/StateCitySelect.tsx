import { useMemo, useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { INDIAN_STATES, getCitiesForState } from "@/constants/indianLocations";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SimpleSearchableSelectProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  label: string;
}

const SimpleSearchableSelect = ({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  label,
}: SimpleSearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options.slice(0, 20); // Show first 20 when no search
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter(opt => opt.toLowerCase().includes(lowerSearch)).slice(0, 50);
  }, [options, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (isMobile) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  const handleSelect = (option: string) => {
    onValueChange(option);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    setSearchTerm("");
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm("");
  };

  const renderDropdownContent = () => (
    <>
      {/* Search Input */}
      <div className="p-3 border-b border-border bg-background sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 pr-4 h-10 rounded-xl border-border-strong/10 focus:border-primary"
            autoComplete="off"
            autoCorrect="off"
          />
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-2">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-left transition-all duration-150",
                "hover:bg-secondary active:bg-secondary/80",
                "touch-manipulation select-none",
                value === option && "bg-primary/10 text-primary"
              )}
            >
              <span className="font-medium truncate">{option}</span>
              {value === option && (
                <Check className="w-4 h-4 flex-shrink-0 text-primary" />
              )}
            </button>
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No results for "{searchTerm}"
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-background text-left transition-all",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-50 cursor-not-allowed bg-muted",
          isOpen && "border-primary ring-2 ring-primary/20",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate text-sm">{value || placeholder}</span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Mobile: Full-screen Sheet */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-3xl">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-base font-bold text-left">
                Select {label}
              </SheetTitle>
            </SheetHeader>
            {renderDropdownContent()}
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop: Dropdown Panel */}
      {!isMobile && isOpen && (
        <div className="absolute z-[9999] w-full mt-1 bg-card rounded-xl border shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {renderDropdownContent()}
        </div>
      )}
    </div>
  );
};

interface StateCitySelectProps {
  state: string;
  city: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  stateError?: string;
  cityError?: string;
  disabled?: boolean;
}

export const StateCitySelect = ({
  state,
  city,
  onStateChange,
  onCityChange,
  required = false,
  stateError,
  cityError,
  disabled = false,
}: StateCitySelectProps) => {
  // Get cities for the selected state
  const cities = useMemo(() => getCitiesForState(state), [state]);

  // Handle state change - reset city when state changes
  const handleStateChange = (newState: string) => {
    onStateChange(newState);
    if (newState !== state) {
      onCityChange(""); // Reset city when state changes
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>
          State {required && <span className="text-destructive">*</span>}
        </Label>
        <SimpleSearchableSelect
          options={INDIAN_STATES}
          value={state}
          onValueChange={handleStateChange}
          placeholder="Select state"
          disabled={disabled}
          searchPlaceholder="Search states..."
          label="State"
        />
        {stateError && (
          <p className="text-xs text-destructive">{stateError}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>
          City {required && <span className="text-destructive">*</span>}
        </Label>
        <SimpleSearchableSelect
          options={cities}
          value={city}
          onValueChange={onCityChange}
          placeholder={state ? "Select city" : "Select state first"}
          disabled={disabled || !state}
          searchPlaceholder="Search cities..."
          label="City"
        />
        {cityError && (
          <p className="text-xs text-destructive">{cityError}</p>
        )}
      </div>
    </div>
  );
};

export default StateCitySelect;
