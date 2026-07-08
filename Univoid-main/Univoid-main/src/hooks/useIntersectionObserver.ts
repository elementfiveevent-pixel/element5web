import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  initiallyVisible?: boolean;
}

interface UseIntersectionObserverResult {
  ref: React.RefObject<HTMLDivElement>;
  isVisible: boolean;
  wasEverVisible: boolean;
}

/**
 * Optimized intersection observer hook for lazy rendering
 * - Uses requestIdleCallback for non-critical state updates
 * - Freezes observation once visible for static content
 * - Minimal re-renders through ref-based visibility tracking
 */
export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '100px', // Pre-load 100px before entering viewport
  freezeOnceVisible = true,
  initiallyVisible = false,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(initiallyVisible);
  const [wasEverVisible, setWasEverVisible] = useState(initiallyVisible);
  const frozen = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || frozen.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          
          if (visible) {
            // Use requestIdleCallback for non-critical update
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => {
                setIsVisible(true);
                setWasEverVisible(true);
              }, { timeout: 50 });
            } else {
              setIsVisible(true);
              setWasEverVisible(true);
            }
            
            if (freezeOnceVisible) {
              frozen.current = true;
              observer.unobserve(element);
            }
          } else if (!freezeOnceVisible) {
            setIsVisible(false);
          }
        });
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return { ref, isVisible, wasEverVisible };
}

/**
 * Batch intersection observer for multiple elements
 * More efficient than individual observers per element
 */
export function useBatchIntersectionObserver(
  count: number,
  options: UseIntersectionObserverOptions = {}
) {
  const [visibleIndices, setVisibleIndices] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const setRef = useCallback((index: number) => (el: HTMLDivElement | null) => {
    refs.current[index] = el;
  }, []);

  useEffect(() => {
    const {
      threshold = 0,
      root = null,
      rootMargin = '100px',
    } = options;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates = new Map<number, boolean>();
        
        entries.forEach((entry) => {
          const index = refs.current.indexOf(entry.target as HTMLDivElement);
          if (index !== -1) {
            updates.set(index, entry.isIntersecting);
          }
        });

        if (updates.size > 0) {
          setVisibleIndices((prev) => {
            const next = new Set(prev);
            updates.forEach((visible, index) => {
              if (visible) next.add(index);
              else next.delete(index);
            });
            return next;
          });
        }
      },
      { threshold, root, rootMargin }
    );

    refs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [count, options]);

  return { setRef, visibleIndices };
}
