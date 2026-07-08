import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Ultra-fast event card skeleton with shimmer effect
 */
export const EventCardSkeleton = memo(function EventCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/50">
      {/* Flyer skeleton with shimmer */}
      <div className="aspect-square w-full bg-muted skeleton-optimized" />
      
      <CardContent className="p-4 space-y-3">
        {/* Title */}
        <div className="h-5 w-3/4 rounded-full bg-muted skeleton-optimized" />
        
        {/* Badge */}
        <div className="h-5 w-20 rounded-full bg-muted skeleton-optimized" />
        
        {/* Date */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted skeleton-optimized" />
          <div className="h-4 w-36 rounded-full bg-muted skeleton-optimized" />
        </div>
        
        {/* Location */}
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-muted skeleton-optimized" />
          <div className="h-4 w-28 rounded-full bg-muted skeleton-optimized" />
        </div>
        
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded-full bg-muted skeleton-optimized" />
            <div className="h-3 w-12 rounded-full bg-muted skeleton-optimized" />
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted skeleton-optimized" />
        </div>
      </CardContent>
    </Card>
  );
});

export default EventCardSkeleton;
