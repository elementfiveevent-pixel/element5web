import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchCollegeStates, fetchCollegeDistricts } from "@/hooks/useCollegeSearchable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CollegeStateSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function CollegeStateSelect({
  value,
  onValueChange,
  label = "State",
  placeholder = "Select state",
  disabled = false,
  required = false,
  error,
}: CollegeStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch states on mount
  useEffect(() => {
    const loadStates = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const data = await fetchCollegeStates();
        if (data.length === 0) {
          setFetchError("No states available. Please try again.");
        } else {
          setStates(data);
        }
      } catch (err) {
        console.error("Failed to load states:", err);
        setFetchError("Failed to load states. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };
    loadStates();
  }, []);

  // Filter states based on search
  const filteredStates = useMemo(() => {
    if (!searchTerm) return states.slice(0, 20);
    const lowerSearch = searchTerm.toLowerCase();
    return states.filter((s) => s.toLowerCase().includes(lowerSearch)).slice(0, 50);
  }, [states, searchTerm]);

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

  const handleSelect = useCallback(
    (state: string) => {
      onValueChange(state);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onValueChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange("");
      setSearchTerm("");
    },
    [onValueChange]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

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
            placeholder="Search states..."
            className="pl-9 pr-4 h-10 rounded-xl border-border-strong/10 focus:border-primary"
            autoComplete="off"
            autoCorrect="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary pointer-events-none" />
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-2">
        {isLoading ? (
          <div className="py-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading states...</p>
          </div>
        ) : fetchError ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive">{fetchError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-2 text-xs text-primary underline"
            >
              Retry
            </button>
          </div>
        ) : filteredStates.length > 0 ? (
          filteredStates.map((state) => (
            <button
              key={state}
              type="button"
              onClick={() => handleSelect(state)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-left transition-all duration-150",
                "hover:bg-secondary active:bg-secondary/80",
                "touch-manipulation select-none",
                value === state && "bg-primary/10 text-primary"
              )}
            >
              <span className="font-medium truncate">{state}</span>
              {value === state && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
            </button>
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `No results for "${searchTerm}"` : "No states available"}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

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
          <ChevronDown
            className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Mobile: Full-screen Sheet */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-3xl">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-base font-bold text-left">Select {label}</SheetTitle>
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
}

// District select component
interface CollegeDistrictSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  stateFilter: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function CollegeDistrictSelect({
  value,
  onValueChange,
  stateFilter,
  label = "City/District",
  placeholder = "Select city",
  disabled = false,
  required = false,
  error,
}: CollegeDistrictSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // Fetch districts when state changes
  useEffect(() => {
    if (!stateFilter) {
      setDistricts([]);
      return;
    }

    const loadDistricts = async () => {
      setIsLoading(true);
      const data = await fetchCollegeDistricts(stateFilter);
      setDistricts(data);
      setIsLoading(false);
    };
    loadDistricts();
  }, [stateFilter]);

  // Filter districts based on search
  const filteredDistricts = useMemo(() => {
    if (!searchTerm) return districts.slice(0, 20);
    const lowerSearch = searchTerm.toLowerCase();
    return districts.filter((d) => d.toLowerCase().includes(lowerSearch)).slice(0, 50);
  }, [districts, searchTerm]);

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

  const handleSelect = useCallback(
    (district: string) => {
      onValueChange(district);
      setIsOpen(false);
      setSearchTerm("");
    },
    [onValueChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onValueChange("");
      setSearchTerm("");
    },
    [onValueChange]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  const isDisabled = disabled || !stateFilter;

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
            placeholder="Search cities..."
            className="pl-9 pr-4 h-10 rounded-xl border-border-strong/10 focus:border-primary"
            autoComplete="off"
            autoCorrect="off"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary pointer-events-none" />
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-2">
        {filteredDistricts.length > 0 ? (
          filteredDistricts.map((district) => (
            <button
              key={district}
              type="button"
              onClick={() => handleSelect(district)}
              className={cn(
                "w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl text-left transition-all duration-150",
                "hover:bg-secondary active:bg-secondary/80",
                "touch-manipulation select-none",
                value === district && "bg-primary/10 text-primary"
              )}
            >
              <span className="font-medium truncate">{district}</span>
              {value === district && <Check className="w-4 h-4 flex-shrink-0 text-primary" />}
            </button>
          ))
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `No results for "${searchTerm}"` : "No cities available"}
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      {label && (
        <Label>
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
      )}

      <button
        type="button"
        onClick={() => !isDisabled && setIsOpen(true)}
        disabled={isDisabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-background text-left transition-all",
          "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
          isDisabled && "opacity-50 cursor-not-allowed bg-muted",
          isOpen && "border-primary ring-2 ring-primary/20",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate text-sm">
          {!stateFilter ? "Select state first" : value || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown
            className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
          />
        </div>
      </button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Mobile: Full-screen Sheet */}
      {isMobile && (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="bottom" className="h-[75vh] p-0 rounded-t-3xl">
            <SheetHeader className="px-4 py-3 border-b border-border">
              <SheetTitle className="text-base font-bold text-left">Select {label}</SheetTitle>
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
}
