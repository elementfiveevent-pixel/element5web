import React, { memo, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface LazySectionProps {
  children: React.ReactNode;
  className?: string;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  animateIn?: boolean;
  staggerIndex?: number;
}

/**
 * LazySection - Renders children only when visible in viewport
 * - Reduces initial render work
 * - GPU-accelerated fade-in animation
 * - Minimal re-renders through memoization
 */
export const LazySection = memo(function LazySection({
  children,
  className,
  fallback,
  rootMargin = '300px', // Increased pre-load distance for faster apparent loading
  threshold = 0,
  animateIn = true,
  staggerIndex = 0,
}: LazySectionProps) {
  const { ref, isVisible, wasEverVisible } = useIntersectionObserver({
    rootMargin,
    threshold,
    freezeOnceVisible: true,
  });

  // Stagger animation delay - faster timing
  const staggerDelay = staggerIndex > 0 && staggerIndex <= 6 ? `${staggerIndex * 30}ms` : undefined;

  // Once visible, render immediately without waiting
  if (wasEverVisible) {
    return (
      <div
        ref={ref}
        className={cn(animateIn && 'animate-in fade-in-0 duration-200', className)}
        style={staggerDelay ? { animationDelay: staggerDelay } : undefined}
      >
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      {fallback}
    </div>
  );
});

interface OptimizedCardWrapperProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
  enableHover?: boolean;
}

/**
 * OptimizedCardWrapper - GPU-accelerated card with hover effects
 * - Uses transform for hover (GPU-accelerated)
 * - Avoids box-shadow animation on hover (expensive)
 * - Static shadow with transform lift
 */
export const OptimizedCardWrapper = memo(function OptimizedCardWrapper({
  children,
  className,
  index = 0,
  enableHover = true,
}: OptimizedCardWrapperProps) {
  const staggerClass = useMemo(() => {
    if (index <= 0 || index > 6) return '';
    return `stagger-${index}`;
  }, [index]);

  return (
    <div
      className={cn(
        'transform-gpu',
        enableHover && 'transition-transform duration-300 hover:-translate-y-1 hover:scale-[1.01]',
        staggerClass,
        className
      )}
    >
      {children}
    </div>
  );
});

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  overscan?: number;
}

/**
 * Simple visibility-based "virtualization" for lists
 * - Renders skeleton for off-screen items
 * - Full render for visible items
 * - Good for medium-sized lists (20-100 items)
 */
export function VisibilityList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
  overscan = 3,
}: VirtualizedListProps<T>) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <LazySection
          key={keyExtractor(item, index)}
          className={itemClassName}
          fallback={<div className="h-48 bg-muted/50 rounded-2xl skeleton-optimized" />}
          staggerIndex={index <= 6 ? index : 0}
        >
          {renderItem(item, index)}
        </LazySection>
      ))}
    </div>
  );
}

export default LazySection;
