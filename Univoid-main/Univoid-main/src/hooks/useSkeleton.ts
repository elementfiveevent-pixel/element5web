import { useState, useEffect, useRef } from 'react';

interface UseSkeletonOptions {
  /** Delay before showing skeleton (default: 150ms) - skeleton only appears if loading takes longer than this */
  showDelay?: number;
}

/**
 * Hook that delays skeleton appearance to avoid flash for fast loads.
 * 
 * KEY BEHAVIOR:
 * - If data loads within showDelay (150ms), skeleton NEVER appears
 * - If data takes longer, skeleton appears after the delay
 * - Instant content render for cached/fast data
 * 
 * @param externalLoading - The loading state from your data fetching
 * @param options - Configuration options
 * @returns Whether to show the skeleton
 */
export function useSkeletonSync(
  externalLoading: boolean,
  options: UseSkeletonOptions = {}
): boolean {
  const { showDelay = 150 } = options;
  
  // Start with skeleton hidden - content renders immediately if data is ready
  const [showSkeleton, setShowSkeleton] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }

    if (externalLoading) {
      // Don't show skeleton immediately - wait for delay
      // This prevents skeleton flash for fast loads
      showTimeoutRef.current = setTimeout(() => {
        setShowSkeleton(true);
      }, showDelay);
    } else {
      // Data is ready - hide skeleton immediately
      setShowSkeleton(false);
    }

    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, [externalLoading, showDelay]);

  return showSkeleton;
}

/**
 * @deprecated Use useSkeletonSync instead
 */
export function useSkeleton(options: { initialLoading?: boolean; minDisplayTime?: number } = {}) {
  const { initialLoading = false, minDisplayTime = 150 } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  
  return {
    isLoading: useSkeletonSync(isLoading, { showDelay: minDisplayTime }),
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
    setLoading: setIsLoading,
  };
}
