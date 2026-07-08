import { memo } from 'react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  className?: string;
  variant?: 'grid' | 'list' | 'detail' | 'cards';
  count?: number;
}

/**
 * Ultra-fast page skeleton loaders with shimmer effect
 * GPU-accelerated for smooth performance
 */

// Card skeleton for grid layouts
const CardSkeleton = memo(function CardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="rounded-2xl border border-border bg-card overflow-hidden"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image placeholder */}
      <div className="aspect-[4/3] bg-muted skeleton-optimized" />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-muted skeleton-optimized" />
        <div className="h-4 w-1/2 rounded-full bg-muted skeleton-optimized" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-muted skeleton-optimized" />
          <div className="h-6 w-20 rounded-full bg-muted skeleton-optimized" />
        </div>
      </div>
    </div>
  );
});

// List item skeleton
const ListItemSkeleton = memo(function ListItemSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div 
      className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="w-12 h-12 rounded-xl bg-muted skeleton-optimized flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded-full bg-muted skeleton-optimized" />
        <div className="h-3 w-1/3 rounded-full bg-muted skeleton-optimized" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-muted skeleton-optimized" />
    </div>
  );
});

// Grid skeleton loader
export const GridSkeleton = memo(function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} index={i} />
      ))}
    </div>
  );
});

// List skeleton loader
export const ListSkeleton = memo(function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <ListItemSkeleton key={i} index={i} />
      ))}
    </div>
  );
});

// Detail page skeleton
export const DetailSkeleton = memo(function DetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded-lg bg-muted skeleton-optimized" />
        <div className="flex gap-3">
          <div className="h-6 w-24 rounded-full bg-muted skeleton-optimized" />
          <div className="h-6 w-32 rounded-full bg-muted skeleton-optimized" />
        </div>
      </div>
      {/* Image */}
      <div className="aspect-video rounded-2xl bg-muted skeleton-optimized" />
      {/* Content */}
      <div className="space-y-3">
        <div className="h-4 w-full rounded-full bg-muted skeleton-optimized" />
        <div className="h-4 w-5/6 rounded-full bg-muted skeleton-optimized" />
        <div className="h-4 w-4/5 rounded-full bg-muted skeleton-optimized" />
        <div className="h-4 w-3/4 rounded-full bg-muted skeleton-optimized" />
      </div>
    </div>
  );
});

// Main PageLoader component
export const PageLoader = memo(function PageLoader({ 
  className, 
  variant = 'grid', 
  count 
}: PageLoaderProps) {
  return (
    <div className={cn("py-8", className)}>
      <div className="container-wide">
        {/* Page header skeleton */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted skeleton-optimized" />
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-lg bg-muted skeleton-optimized" />
              <div className="h-4 w-64 rounded-full bg-muted skeleton-optimized" />
            </div>
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="h-10 w-48 rounded-xl bg-muted skeleton-optimized" />
          <div className="h-10 w-32 rounded-xl bg-muted skeleton-optimized" />
          <div className="h-10 w-32 rounded-xl bg-muted skeleton-optimized" />
        </div>

        {/* Content skeleton */}
        {variant === 'grid' && <GridSkeleton count={count || 6} />}
        {variant === 'list' && <ListSkeleton count={count || 5} />}
        {variant === 'detail' && <DetailSkeleton />}
        {variant === 'cards' && <GridSkeleton count={count || 9} />}
      </div>
    </div>
  );
});

export default PageLoader;
