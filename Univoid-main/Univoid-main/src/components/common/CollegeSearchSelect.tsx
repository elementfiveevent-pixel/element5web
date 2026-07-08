import { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, Loader2, Search, X, Plus, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollegeSearchable } from "@/hooks/useCollegeSearchable";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface CollegeSearchSelectProps {
  label: string;
  placeholder?: string;
  value?: string;
  displayValue?: string;
  stateFilter?: string | null;
  districtFilter?: string | null;
  onSelect: (item: { id: string; name: string; isCustom?: boolean }) => void;
  disabled?: boolean;
  required?: boolean;
}

export function CollegeSearchSelect({
  label,
  placeholder = "Search your college...",
  value,
  displayValue,
  stateFilter,
  districtFilter,
  onSelect,
  disabled = false,
  required = false,
}: CollegeSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  const { searchTerm, setSearchTerm, results, isLoading, hasSearched, hasStateFilter } =
    useCollegeSearchable({
      stateFilter,
      districtFilter,
    });

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowManualInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile]);

  // Focus input when dropdown opens (desktop)
  useEffect(() => {
    if (isOpen && inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isOpen, isMobile]);

  // Focus manual input when shown
  useEffect(() => {
    if (showManualInput && manualInputRef.current) {
      setTimeout(() => manualInputRef.current?.focus(), 100);
    }
  }, [showManualInput]);

  const handleSelect = useCallback(
    (item: { id: string; name: string; isCustom?: boolean }) => {
      onSelect(item);
      setIsOpen(false);
      setSearchTerm("");
      setShowManualInput(false);
      setManualValue("");
    },
    [onSelect, setSearchTerm]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect({ id: "", name: "" });
      setSearchTerm("");
      setManualValue("");
      setShowManualInput(false);
    },
    [onSelect, setSearchTerm]
  );

  const handleOpen = useCallback(() => {
    if (!disabled && hasStateFilter) {
      setIsOpen(true);
      setShowManualInput(false);
    }
  }, [disabled, hasStateFilter]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowManualInput(false);
    setSearchTerm("");
  }, [setSearchTerm]);

  const handleManualEntry = useCallback(() => {
    setShowManualInput(true);
    setManualValue("");
  }, []);

  const handleManualSubmit = useCallback(() => {
    if (manualValue.trim()) {
      onSelect({
        id: `custom_${Date.now()}`,
        name: manualValue.trim(),
        isCustom: true,
      });
      setIsOpen(false);
      setShowManualInput(false);
      setManualValue("");
      setSearchTerm("");
    }
  }, [manualValue, onSelect, setSearchTerm]);

  const handleItemTap = useCallback(
    (item: { id: string; name: string }) =>
      (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        handleSelect(item);
      },
    [handleSelect]
  );

  // Render dropdown content
  const renderDropdownContent = () => (
    <>
      {/* Search Input */}
      <div className="p-3 border-b border-border bg-background sticky top-0 z-10">
        {showManualInput ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Enter your college name:
            </p>
            <div className="flex gap-2">
              <Input
                ref={manualInputRef}
                type="text"
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleManualSubmit();
                  }
                }}
                placeholder="Type your college name..."
                className="flex-1 h-10 rounded-xl border-border-strong/10 focus:border-primary"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
              />
              <button
                type="button"
                onClick={handleManualSubmit}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleManualSubmit();
                }}
                disabled={!manualValue.trim()}
                className={cn(
                  "px-4 py-2 rounded-xl font-medium text-sm transition-all",
                  manualValue.trim()
                    ? "bg-primary text-primary-foreground active:scale-95"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Done
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setShowManualInput(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to list
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search college name..."
              className="pl-9 pr-4 h-10 rounded-xl border-border-strong/10 focus:border-primary"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary pointer-events-none" />
            )}
          </div>
        )}
      </div>

      {/* Results List */}
      {!showManualInput && (
        <div className="max-h-[50vh] overflow-y-auto overscroll-contain p-2 -webkit-overflow-scrolling-touch">
          {!hasSearched && results.length > 0 && (
            <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Popular colleges
            </p>
          )}

          {results.length > 0 ? (
            <>
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleItemTap(item)}
                  onTouchEnd={handleItemTap(item)}
                  className={cn(
                    "w-full flex flex-col gap-0.5 px-3 py-3 rounded-xl text-left transition-all duration-150",
                    "hover:bg-secondary active:bg-secondary/80 active:scale-[0.98]",
                    "touch-manipulation select-none",
                    value === item.id && "bg-primary/10"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "font-medium truncate",
                        value === item.id && "text-primary"
                      )}
                    >
                      {item.name}
                    </span>
                    {value === item.id && (
                      <Check className="w-4 h-4 flex-shrink-0 text-primary" />
                    )}
                  </div>
                  {(item as any).district && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {(item as any).district}
                    </span>
                  )}
                </button>
              ))}

              {/* Manual Entry Option */}
              <div className="border-t border-border mt-2 pt-2">
                <button
                  type="button"
                  onClick={handleManualEntry}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleManualEntry();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-3.5 rounded-xl text-left transition-all duration-150",
                    "hover:bg-secondary active:bg-secondary/80 active:scale-[0.98]",
                    "touch-manipulation select-none text-muted-foreground"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="font-medium">Can't find your college? Type manually</span>
                </button>
              </div>
            </>
          ) : hasSearched ? (
            <div className="py-4 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                No results for "{searchTerm}"
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSelect({
                      id: `custom_${searchTerm}`,
                      name: searchTerm,
                      isCustom: true,
                    })
                  }
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleSelect({
                      id: `custom_${searchTerm}`,
                      name: searchTerm,
                      isCustom: true,
                    });
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all",
                    "active:scale-95 touch-manipulation"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Use "{searchTerm}"
                </button>
                <p className="text-xs text-muted-foreground">or</p>
                <button
                  type="button"
                  onClick={handleManualEntry}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleManualEntry();
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium transition-all",
                    "active:scale-95 touch-manipulation"
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Plus className="w-3 h-3" />
                  Type manually
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <Search className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Start typing to search colleges
              </p>
              <button
                type="button"
                onClick={handleManualEntry}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleManualEntry();
                }}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-sm font-medium transition-all",
                  "active:scale-95 touch-manipulation"
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <Plus className="w-3 h-3" />
                Can't find it? Type manually
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-2" ref={containerRef}>
      <label className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <div className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={handleOpen}
          onTouchEnd={(e) => {
            if (!disabled && hasStateFilter) {
              e.preventDefault();
              handleOpen();
            }
          }}
          disabled={disabled || !hasStateFilter}
          className={cn(
            "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border-2 border-border-strong/20 bg-card text-left transition-all duration-200",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "touch-manipulation select-none",
            (disabled || !hasStateFilter) && "opacity-50 cursor-not-allowed",
            isOpen && "border-primary ring-2 ring-primary/20",
            !displayValue && "text-muted-foreground"
          )}
          style={{
            boxShadow: isOpen
              ? "3px 3px 0px hsl(var(--foreground))"
              : "2px 2px 0px hsl(var(--foreground) / 0.1)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <span className="truncate">
            {!hasStateFilter
              ? "Select state first"
              : displayValue || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {displayValue && hasStateFilter && (
              <button
                type="button"
                onClick={handleClear}
                onTouchEnd={handleClear}
                className="p-1.5 rounded-full hover:bg-secondary active:bg-secondary/80 transition-colors touch-manipulation"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </button>

        {/* Mobile: Full-screen Sheet */}
        {isMobile && (
          <Sheet
            open={isOpen}
            onOpenChange={(open) => {
              if (!open) handleClose();
            }}
          >
            <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
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
          <div
            className="absolute z-[9999] w-full mt-2 bg-card rounded-2xl border-2 border-border-strong/20 shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              boxShadow: "4px 4px 0px hsl(var(--foreground) / 0.15)",
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
            }}
          >
            {renderDropdownContent()}
          </div>
        )}
      </div>
    </div>
  );
}
