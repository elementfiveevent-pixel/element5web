import { useCallback, useRef, useEffect } from 'react';

/**
 * GPU-optimized animation utilities
 * - Uses only transform and opacity (GPU-accelerated)
 * - Avoids layout-triggering properties
 * - Provides smooth 60fps animations
 */

export interface AnimationStyle {
  transform: string;
  opacity: number;
  willChange: string;
}

/**
 * Create GPU-accelerated fade-in animation styles
 */
export function useFadeInAnimation(
  isVisible: boolean,
  delay: number = 0
): React.CSSProperties {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
    transition: `opacity 0.3s ease-out ${delay}ms, transform 0.3s ease-out ${delay}ms`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  };
}

/**
 * Create GPU-accelerated hover animation styles
 */
export function useHoverAnimation(): {
  style: React.CSSProperties;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
} {
  const elementRef = useRef<HTMLElement | null>(null);
  
  const handlers = {
    onMouseEnter: useCallback(() => {
      if (elementRef.current) {
        elementRef.current.style.transform = 'translateY(-4px) scale(1.01)';
      }
    }, []),
    onMouseLeave: useCallback(() => {
      if (elementRef.current) {
        elementRef.current.style.transform = 'translateY(0) scale(1)';
      }
    }, []),
  };

  const style: React.CSSProperties = {
    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    willChange: 'transform',
  };

  return { style, handlers };
}

/**
 * Stagger animation delays for lists
 * Limits stagger to first N items to prevent long waits
 */
export function getStaggerDelay(
  index: number,
  baseDelay: number = 50,
  maxItems: number = 6
): number {
  if (index >= maxItems) return 0; // No delay for items past the limit
  return index * baseDelay;
}

/**
 * GPU-accelerated skeleton pulse using transform
 * Better than opacity-only pulse
 */
export const skeletonPulseStyle: React.CSSProperties = {
  animation: 'skeleton-pulse 1.5s ease-in-out infinite',
  willChange: 'opacity',
};

/**
 * Prevent animation re-trigger on re-render
 * Returns true only on first render for initial animation
 */
export function useInitialMount(): boolean {
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    isInitialMount.current = false;
  }, []);

  return isInitialMount.current;
}

/**
 * Optimized class string for GPU animations
 * Use these classes instead of inline styles when possible
 */
export const GPU_ANIMATION_CLASSES = {
  // Fade and scale in
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  scaleIn: 'animate-scale-in',
  
  // Hover effects (use with group)
  hoverLift: 'transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]',
  hoverScale: 'transition-transform duration-200 hover:scale-105',
  
  // Will-change hints
  willChangeTransform: 'will-change-transform',
  willChangeOpacity: 'will-change-[opacity]',
  
  // GPU acceleration trigger
  gpuAccelerate: 'transform-gpu',
} as const;
