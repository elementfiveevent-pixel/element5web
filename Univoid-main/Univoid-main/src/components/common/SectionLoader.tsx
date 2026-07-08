import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SectionLoader({ className, size = "md" }: SectionLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center py-8", className)}>
      <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
    </div>
  );
}

interface EmptyStateProps {
  message: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      <p className="text-muted-foreground mb-4">{message}</p>
      {action}
    </div>
  );
}

interface LoadMoreButtonProps {
  onClick: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export function LoadMoreButton({ onClick, isLoading, hasMore }: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <div className="flex justify-center mt-8">
      <button
        onClick={onClick}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Load More'
        )}
      </button>
    </div>
  );
}
