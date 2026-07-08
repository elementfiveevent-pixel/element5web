import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';
import { useCachedQuery, CACHE_TIMES, STALE_TIMES } from './useCachedQuery';
import { QueryKey } from '@tanstack/react-query';

interface DebouncedSearchOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Minimum characters before search triggers (default: 0) */
  minChars?: number;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
}

/**
 * Hook for debounced search with caching
 * Prevents excessive API calls during typing
 * 
 * @example
 * const { 
 *   searchTerm, 
 *   setSearchTerm, 
 *   data, 
 *   isLoading 
 * } = useDebouncedSearch(
 *   'materials-search',
 *   async (term) => searchMaterials(term),
 *   { debounceMs: 300, minChars: 2 }
 * );
 */
export function useDebouncedSearch<TData>(
  queryKeyPrefix: string,
  searchFn: (searchTerm: string) => Promise<TData>,
  options?: DebouncedSearchOptions
) {
  const {
    debounceMs = 300,
    minChars = 0,
    enabled = true,
    cacheTime = CACHE_TIMES.DYNAMIC,
    staleTime = STALE_TIMES.SHORT,
  } = options || {};

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  // Only search if we meet minimum character requirement
  const shouldSearch = enabled && debouncedSearchTerm.length >= minChars;

  const queryKey: QueryKey = useMemo(
    () => [queryKeyPrefix, debouncedSearchTerm],
    [queryKeyPrefix, debouncedSearchTerm]
  );

  const query = useCachedQuery<TData>(
    queryKey,
    () => searchFn(debouncedSearchTerm),
    {
      enabled: shouldSearch,
      cacheTime,
      staleTime,
    }
  );

  // Track if the user is currently typing
  const isTyping = searchTerm !== debouncedSearchTerm;

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isTyping,
    isSearching: query.isLoading || query.isFetching,
    ...query,
  };
}

interface DebouncedFiltersOptions {
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** Whether the query is enabled (default: true) */
  enabled?: boolean;
  /** Cache time in milliseconds */
  cacheTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
}

/**
 * Hook for filtering data with debounced filters
 * Great for filter panels with multiple options
 * 
 * @example
 * const {
 *   filters,
 *   setFilter,
 *   resetFilters,
 *   data
 * } = useDebouncedFilters(
 *   'materials-filter',
 *   async (filters) => fetchMaterials(filters),
 *   { branch: '', course: '', status: 'approved' },
 *   { debounceMs: 500 }
 * );
 */
export function useDebouncedFilters<TFilters extends Record<string, unknown>, TData>(
  queryKeyPrefix: string,
  fetchFn: (filters: TFilters) => Promise<TData>,
  defaultFilters: TFilters,
  options?: DebouncedFiltersOptions
) {
  const {
    debounceMs = 500,
    enabled = true,
    cacheTime = CACHE_TIMES.DYNAMIC,
    staleTime = STALE_TIMES.MEDIUM,
  } = options || {};

  const [filters, setFilters] = useState<TFilters>(defaultFilters);
  const debouncedFilters = useDebounce(filters, debounceMs);

  // Create a stable query key from filters
  const queryKey: QueryKey = useMemo(
    () => [queryKeyPrefix, debouncedFilters],
    [queryKeyPrefix, debouncedFilters]
  );

  const query = useCachedQuery<TData>(
    queryKey,
    () => fetchFn(debouncedFilters),
    {
      enabled,
      cacheTime,
      staleTime,
    }
  );

  const setFilter = <K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const isFiltering = JSON.stringify(filters) !== JSON.stringify(debouncedFilters);

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
    debouncedFilters,
    isFiltering,
    ...query,
  };
}
