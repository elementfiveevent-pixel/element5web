import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';

/**
 * Cache time presets for different data types
 */
export const CACHE_TIMES = {
  /** Static data that rarely changes (e.g., lookup tables) - 30 minutes */
  STATIC: 30 * 60 * 1000,
  /** Semi-static data (e.g., user profile) - 10 minutes */
  SEMI_STATIC: 10 * 60 * 1000,
  /** Dynamic data with moderate update frequency - 5 minutes */
  DYNAMIC: 5 * 60 * 1000,
  /** Frequently changing data - 1 minute */
  FREQUENT: 60 * 1000,
  /** Real-time data - 30 seconds */
  REALTIME: 30 * 1000,
} as const;

/**
 * Stale time presets - how long before data is considered stale
 */
export const STALE_TIMES = {
  /** Data that can be shown stale for a while - 5 minutes */
  LONG: 5 * 60 * 1000,
  /** Standard stale time - 2 minutes */
  MEDIUM: 2 * 60 * 1000,
  /** Short stale time - 30 seconds */
  SHORT: 30 * 1000,
  /** Always refetch - 0 seconds */
  IMMEDIATE: 0,
} as const;

interface CachedQueryOptions {
  /** Cache duration preset or custom milliseconds */
  cacheTime?: keyof typeof CACHE_TIMES | number;
  /** Stale time preset or custom milliseconds */
  staleTime?: keyof typeof STALE_TIMES | number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Refetch on mount behavior */
  refetchOnMount?: boolean;
  /** Refetch interval in milliseconds */
  refetchInterval?: number;
}

/**
 * Enhanced useQuery hook with optimized caching defaults
 * @param queryKey - Query key for caching
 * @param queryFn - Function that fetches the data
 * @param options - Query options with cache presets
 */
export function useCachedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: CachedQueryOptions
) {
  const { 
    cacheTime, 
    staleTime, 
    enabled = true,
    refetchOnMount,
    refetchInterval,
  } = options || {};

  // Resolve cache time
  const resolvedGcTime = typeof cacheTime === 'string' 
    ? CACHE_TIMES[cacheTime] 
    : cacheTime ?? CACHE_TIMES.DYNAMIC;

  // Resolve stale time
  const resolvedStaleTime = typeof staleTime === 'string'
    ? STALE_TIMES[staleTime]
    : staleTime ?? STALE_TIMES.MEDIUM;

  return useQuery({
    queryKey,
    queryFn,
    gcTime: resolvedGcTime,
    staleTime: resolvedStaleTime,
    enabled,
    refetchOnMount,
    refetchInterval,
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook for static lookup data (branches, states, cities, etc.)
 */
export function useStaticQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<CachedQueryOptions, 'cacheTime' | 'staleTime'>
) {
  return useCachedQuery(queryKey, queryFn, {
    cacheTime: 'STATIC',
    staleTime: 'LONG',
    refetchOnMount: false,
    ...options,
  });
}

/**
 * Hook for list data that updates moderately
 */
export function useListQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<CachedQueryOptions, 'cacheTime' | 'staleTime'>
) {
  return useCachedQuery(queryKey, queryFn, {
    cacheTime: 'DYNAMIC',
    staleTime: 'MEDIUM',
    ...options,
  });
}

/**
 * Hook for real-time or frequently updating data
 */
export function useRealtimeQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<CachedQueryOptions, 'cacheTime' | 'staleTime'>
) {
  return useCachedQuery(queryKey, queryFn, {
    cacheTime: 'REALTIME',
    staleTime: 'IMMEDIATE',
    refetchInterval: 30000, // Auto-refetch every 30 seconds
    ...options,
  });
}
