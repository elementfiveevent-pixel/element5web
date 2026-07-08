import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { COURSE_OPTIONS, BRANCH_OPTIONS, LANGUAGE_OPTIONS } from "@/constants/materialOptions";
import { MaterialFiltersState, initialFilters } from "./MaterialFilters";

interface MobileFilterSheetProps {
  filters: MaterialFiltersState;
  onFiltersChange: (filters: MaterialFiltersState) => void;
  onClearFilters: () => void;
}

export default function MobileFilterSheet({ filters, onFiltersChange, onClearFilters }: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  
  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(initialFilters);
    onClearFilters();
    setIsOpen(false);
  };

  const updateLocalFilter = (key: keyof MaterialFiltersState, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value === 'all' ? '' : value }));
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search materials..."
          className="pl-11 pr-4 h-12 rounded-full border-2 border-foreground bg-card"
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        />
      </div>

      {/* Filter Button */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full h-11 rounded-full border-2 border-foreground gap-2 justify-center"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-left">Filter Materials</SheetTitle>
          </SheetHeader>

          <div className="py-6 space-y-5 overflow-y-auto max-h-[calc(85vh-180px)]">
            {/* Course */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Course</Label>
              <Select value={localFilters.course || 'all'} onValueChange={(v) => updateLocalFilter('course', v)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {COURSE_OPTIONS.filter(c => c !== 'Other').map((course) => (
                    <SelectItem key={course} value={course}>{course}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Branch</Label>
              <Select value={localFilters.branch || 'all'} onValueChange={(v) => updateLocalFilter('branch', v)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {BRANCH_OPTIONS.filter(b => b !== 'Other').map((branch) => (
                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select value={localFilters.language || 'all'} onValueChange={(v) => updateLocalFilter('language', v)}>
                <SelectTrigger className="h-12 rounded-xl border-2">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {LANGUAGE_OPTIONS.filter(l => l !== 'Other').map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              <Input
                placeholder="e.g. Physics, Calculus"
                className="h-12 rounded-xl border-2"
                value={localFilters.subject}
                onChange={(e) => updateLocalFilter('subject', e.target.value)}
              />
            </div>

            {/* College */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">College</Label>
              <Input
                placeholder="e.g. IIT Delhi"
                className="h-12 rounded-xl border-2"
                value={localFilters.college}
                onChange={(e) => updateLocalFilter('college', e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="pt-4 border-t gap-3">
            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClear} className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
