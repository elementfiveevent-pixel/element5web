import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MaterialCardSkeletonProps {
  className?: string;
}

/**
 * Ultra-fast skeleton with shimmer effect
 * Uses single animation for better GPU performance
 */
const MaterialCardSkeleton = memo(function MaterialCardSkeleton({ className }: MaterialCardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden h-full flex flex-col border-border/50", className)}>
      <CardContent className="p-0 flex flex-col h-full">
        {/* Top Section */}
        <div className="p-5 pb-0 flex-1 flex flex-col">
          <div className="flex gap-4">
            {/* Thumbnail - shimmer effect */}
            <div className="w-20 h-24 flex-shrink-0 rounded-xl bg-muted skeleton-optimized" />
            
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* Title */}
              <div className="h-4 w-full rounded-full bg-muted skeleton-optimized" />
              <div className="h-4 w-2/3 rounded-full bg-muted skeleton-optimized" />
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-1">
                <div className="h-5 w-16 rounded-full bg-muted skeleton-optimized" />
                <div className="h-5 w-20 rounded-full bg-muted skeleton-optimized" />
              </div>
              
              {/* Uploader */}
              <div className="flex items-center gap-2 mt-auto">
                <div className="h-3 w-20 rounded-full bg-muted skeleton-optimized" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-5 pb-5 pt-3 mt-auto border-t border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-4 w-10 rounded-full bg-muted skeleton-optimized" />
            <div className="h-4 w-10 rounded-full bg-muted skeleton-optimized" />
            <div className="flex-1" />
            <div className="h-8 w-20 rounded-lg bg-muted skeleton-optimized" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default MaterialCardSkeleton;
