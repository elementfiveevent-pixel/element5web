import { useInfiniteQuery, UseInfiniteQueryOptions, QueryKey } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Cursor-based pagination response structure
 */
export interface CursorPage<T> {
  /** Array of items in this page */
  data: T[];
  /** Cursor for the next page (null if no more pages) */
  nextCursor: string | null;
  /** Whether there are more pages */
  hasMore: boolean;
  /** Total count if available */
  totalCount?: number;
}

/**
 * Parameters for fetching a page
 */
export interface CursorPageParam {
  cursor: string | null;
  limit: number;
}

interface UseCursorPaginationOptions<T> {
  /** Number of items per page (default: 20) */
  pageSize?: number;
  /** Enable automatic prefetching of next page */
  prefetchNext?: boolean;
  /** Cache time in milliseconds */
  gcTime?: number;
  /** Stale time in milliseconds */
  staleTime?: number;
  /** Whether the query is enabled */
  enabled?: boolean;
  /** Refetch on window focus */
  refetchOnWindowFocus?: boolean;
}

/**
 * Hook for cursor-based infinite pagination
 * 
 * Benefits over offset pagination:
 * - Consistent results even when new items are added
 * - Better performance for large datasets (no OFFSET scanning)
 * - Works well with real-time updates
 * 
 * @example
 * const {
 *   data,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage,
 *   loadMoreRef
 * } = useCursorPagination(
 *   ['materials', filters],
 *   ({ cursor, limit }) => fetchMaterialsWithCursor({ cursor, limit, ...filters }),
 *   { pageSize: 20 }
 * );
 */
export function useCursorPagination<T>(
  queryKey: QueryKey,
  fetchPage: (params: CursorPageParam) => Promise<CursorPage<T>>,
  options?: UseCursorPaginationOptions<T>
) {
  const {
    pageSize = 20,
    gcTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    enabled = true,
    refetchOnWindowFocus = false,
  } = options || {};

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      return fetchPage({
        cursor: pageParam as string | null,
        limit: pageSize,
      });
    },
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined;
    },
    initialPageParam: null as string | null,
    gcTime,
    staleTime,
    enabled,
    refetchOnWindowFocus,
  });

  // Flatten all pages into a single array
  const allItems = query.data?.pages.flatMap((page) => page.data) ?? [];
  
  // Get total count from first page if available
  const totalCount = query.data?.pages[0]?.totalCount;

  // Setup intersection observer for infinite scroll
  const setLoadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node && query.hasNextPage && !query.isFetchingNextPage) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
            query.fetchNextPage();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );
      observerRef.current.observe(node);
    }

    loadMoreRef.current = node;
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    /** Flattened array of all loaded items */
    items: allItems,
    /** Total count if available */
    totalCount,
    /** Number of loaded items */
    loadedCount: allItems.length,
    /** Whether the initial load is in progress */
    isLoading: query.isLoading,
    /** Whether fetching the next page */
    isFetchingNextPage: query.isFetchingNextPage,
    /** Whether any fetch is in progress */
    isFetching: query.isFetching,
    /** Whether there are more pages to load */
    hasNextPage: query.hasNextPage ?? false,
    /** Error if any */
    error: query.error,
    /** Ref to attach to a load-more trigger element */
    loadMoreRef: setLoadMoreRef,
    /** Manual function to fetch next page */
    fetchNextPage: query.fetchNextPage,
    /** Refetch all pages */
    refetch: query.refetch,
    /** Raw query result for advanced use cases */
    query,
  };
}

/**
 * Helper to create cursor from a date field (most common pattern)
 * Uses the created_at or similar timestamp as cursor
 */
export function createDateCursor(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Helper to create cursor from multiple fields (composite cursor)
 * Useful when you need to sort by multiple columns
 */
export function createCompositeCursor(values: Record<string, string | number>): string {
  return btoa(JSON.stringify(values));
}

/**
 * Helper to parse composite cursor
 */
export function parseCompositeCursor(cursor: string): Record<string, string | number> {
  try {
    return JSON.parse(atob(cursor));
  } catch {
    return {};
  }
}

/**
 * Simple Load More button component props
 */
export interface LoadMoreButtonProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loadedCount: number;
  totalCount?: number;
}
