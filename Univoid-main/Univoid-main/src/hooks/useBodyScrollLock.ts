import { useEffect } from 'react';

/**
 * Hook to lock body scroll on desktop viewports - DISABLED
 * Footer should remain accessible, scroll just prioritizes left column
 */
export const useBodyScrollLock = (enabled: boolean = true) => {
  // Intentionally empty - we no longer lock body scroll
  // This allows footer to remain accessible
  useEffect(() => {
    // No-op: body scroll is allowed, wheel events handle scroll priority
  }, [enabled]);
};

export default useBodyScrollLock;
