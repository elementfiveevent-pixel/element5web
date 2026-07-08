import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  loadedCount: number;
  totalCount?: number;
  className?: string;
}

/**
 * Reusable Load More button for paginated lists
 */
export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  loadedCount,
  totalCount,
  className = "",
}: LoadMoreButtonProps) {
  if (!hasNextPage && loadedCount > 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-4">
        Showing all {loadedCount} items
      </p>
    );
  }

  if (!hasNextPage) return null;

  return (
    <div className={`flex flex-col items-center gap-2 py-4 ${className}`}>
      <Button
        variant="outline"
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
        className="min-w-[200px]"
      >
        {isFetchingNextPage ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          "Load More"
        )}
      </Button>
      {totalCount && (
        <p className="text-xs text-muted-foreground">
          Showing {loadedCount} of {totalCount}
        </p>
      )}
    </div>
  );
}

interface InfiniteScrollTriggerProps {
  loadMoreRef: (node: HTMLDivElement | null) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

/**
 * Invisible trigger element for automatic infinite scroll
 * Place at the bottom of your list
 */
export function InfiniteScrollTrigger({
  loadMoreRef,
  hasNextPage,
  isFetchingNextPage,
}: InfiniteScrollTriggerProps) {
  if (!hasNextPage) return null;

  return (
    <div
      ref={loadMoreRef}
      className="flex justify-center py-8"
    >
      {isFetchingNextPage && (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
