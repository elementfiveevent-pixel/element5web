import React, { memo, useMemo, useCallback } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface OptimizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  renderSkeleton: (index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
  itemClassName?: string;
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

/**
 * OptimizedGrid - GPU-accelerated grid with lazy item rendering
 * - Renders skeleton for items before they're visible
 * - Staggered fade-in animations
 * - Memoized render functions
 */
function OptimizedGridInner<T>({
  items,
  renderItem,
  renderSkeleton,
  keyExtractor,
  className,
  itemClassName,
  columns = { mobile: 1, tablet: 2, desktop: 3 },
}: OptimizedGridProps<T>) {
  const gridClasses = useMemo(() => {
    const colClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    };
    return cn(
      'grid gap-4 md:gap-6',
      colClasses[columns.mobile as keyof typeof colClasses],
      `md:${colClasses[columns.tablet as keyof typeof colClasses]}`,
      `lg:${colClasses[columns.desktop as keyof typeof colClasses]}`
    );
  }, [columns]);

  return (
    <div className={cn(gridClasses, className)}>
      {items.map((item, index) => (
        <OptimizedGridItem
          key={keyExtractor(item)}
          item={item}
          index={index}
          renderItem={renderItem}
          renderSkeleton={renderSkeleton}
          className={itemClassName}
        />
      ))}
    </div>
  );
}

interface OptimizedGridItemProps<T> {
  item: T;
  index: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  renderSkeleton: (index: number) => React.ReactNode;
  className?: string;
}

const OptimizedGridItem = memo(function OptimizedGridItem<T>({
  item,
  index,
  renderItem,
  renderSkeleton,
  className,
}: OptimizedGridItemProps<T>) {
  const { ref, isVisible, wasEverVisible } = useIntersectionObserver({
    rootMargin: '150px',
    freezeOnceVisible: true,
  });

  // Stagger only first 6 items
  const staggerClass = index < 6 ? `stagger-${index + 1}` : '';

  return (
    <div
      ref={ref}
      className={cn(
        'lazy-fade-in transform-gpu',
        wasEverVisible && 'visible',
        staggerClass,
        className
      )}
    >
      {wasEverVisible ? renderItem(item, index, isVisible) : renderSkeleton(index)}
    </div>
  );
}) as <T>(props: OptimizedGridItemProps<T>) => React.ReactElement;

export const OptimizedGrid = memo(OptimizedGridInner) as typeof OptimizedGridInner;

export default OptimizedGrid;
