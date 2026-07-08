import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, MapPin } from "lucide-react";
import { INDIAN_STATES, getCitiesForState } from "@/constants/indianLocations";
import { CATEGORY_GROUPS } from "@/constants/eventOptions";

interface EventFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  priceFilter: string;
  onPriceFilterChange: (value: string) => void;
  state?: string;
  onStateChange?: (value: string) => void;
  city?: string;
  onCityChange?: (value: string) => void;
  onClear: () => void;
}

const EVENT_CATEGORIES = [
  { value: "all", label: "All Categories" },
  ...CATEGORY_GROUPS.map(g => ({
    value: g.items[0].toLowerCase(),
    label: `${g.emoji} ${g.label}`,
  })),
];

const PRICE_OPTIONS = [
  { value: "all", label: "All Events" },
  { value: "free", label: "Free Only" },
  { value: "paid", label: "Paid Only" },
];

export const EventFilters = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  priceFilter,
  onPriceFilterChange,
  state = "all",
  onStateChange,
  city = "all",
  onCityChange,
  onClear,
}: EventFiltersProps) => {
  const hasActiveFilters = search || category !== "all" || priceFilter !== "all" || state !== "all" || city !== "all";

  // Get cities for selected state
  const cities = useMemo(() => {
    if (!state || state === "all") return [];
    return getCitiesForState(state);
  }, [state]);

  // Handle state change - reset city when state changes
  const handleStateChange = (newState: string) => {
    onStateChange?.(newState);
    if (newState !== state && onCityChange) {
      onCityChange("all");
    }
  };

  return (
    <div className="flex flex-col gap-3 mb-6 md:mb-8">
      {/* Search - always full width */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Filters row - 2 per row on mobile, inline on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-center">
        {/* Category Filter */}
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {EVENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Price Filter */}
        <Select value={priceFilter} onValueChange={onPriceFilterChange}>
          <SelectTrigger className="w-full sm:w-[130px]">
            <SelectValue placeholder="Price" />
          </SelectTrigger>
          <SelectContent className="bg-background border shadow-lg z-50">
            {PRICE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State Filter */}
        {onStateChange && (
          <Select value={state} onValueChange={handleStateChange}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
              <SelectItem value="all">All States</SelectItem>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* City Filter */}
        {state && state !== "all" && cities.length > 0 && onCityChange && (
          <Select value={city} onValueChange={onCityChange}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={onClear} className="h-12 w-12">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventFilters;
