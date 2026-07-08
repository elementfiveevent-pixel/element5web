import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { COURSE_OPTIONS, BRANCH_OPTIONS, LANGUAGE_OPTIONS } from '@/constants/materialOptions';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileFilterSheet from './MobileFilterSheet';

export interface MaterialFiltersState {
  search: string;
  course: string;
  branch: string;
  subject: string;
  language: string;
  college: string;
}

interface MaterialFiltersProps {
  filters: MaterialFiltersState;
  onFiltersChange: (filters: MaterialFiltersState) => void;
  onClearFilters: () => void;
}

export const initialFilters: MaterialFiltersState = {
  search: '',
  course: '',
  branch: '',
  subject: '',
  language: '',
  college: '',
};

export default function MaterialFilters({ filters, onFiltersChange, onClearFilters }: MaterialFiltersProps) {
  const isMobile = useIsMobile();
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const updateFilter = (key: keyof MaterialFiltersState, value: string) => {
    onFiltersChange({ ...filters, [key]: value === 'all' ? '' : value });
  };

  // Mobile: Use bottom sheet
  if (isMobile) {
    return (
      <MobileFilterSheet 
        filters={filters} 
        onFiltersChange={onFiltersChange} 
        onClearFilters={onClearFilters} 
      />
    );
  }

  // Desktop: Original pills layout
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-8 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, subject..."
          className="pl-10"
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
      </div>

      <Select value={filters.course || 'all'} onValueChange={(v) => updateFilter('course', v)}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Course" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Courses</SelectItem>
          {COURSE_OPTIONS.filter(c => c !== 'Other').map((course) => (
            <SelectItem key={course} value={course}>{course}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.branch || 'all'} onValueChange={(v) => updateFilter('branch', v)}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Branch" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Branches</SelectItem>
          {BRANCH_OPTIONS.filter(b => b !== 'Other').map((branch) => (
            <SelectItem key={branch} value={branch}>{branch}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.language || 'all'} onValueChange={(v) => updateFilter('language', v)}>
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Languages</SelectItem>
          {LANGUAGE_OPTIONS.filter(l => l !== 'Other').map((lang) => (
            <SelectItem key={lang} value={lang}>{lang}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        placeholder="Subject..."
        className="w-full sm:w-[130px]"
        value={filters.subject}
        onChange={(e) => updateFilter('subject', e.target.value)}
      />

      <Input
        placeholder="College..."
        className="w-full sm:w-[130px]"
        value={filters.college}
        onChange={(e) => updateFilter('college', e.target.value)}
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="icon" onClick={onClearFilters}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
