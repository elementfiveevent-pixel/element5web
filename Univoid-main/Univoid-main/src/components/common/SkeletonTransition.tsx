import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SkeletonTransitionProps {
  /** Whether content is still loading */
  isLoading: boolean;
  /** Skeleton component to show while loading */
  skeleton: ReactNode;
  /** Actual content to show after loading */
  children: ReactNode;
  /** Additional class for the wrapper */
  className?: string;
}

/**
 * Wrapper component that handles smooth transitions between skeleton and content.
 * Shows skeleton with shimmer while loading, then smoothly fades to content.
 */
export function SkeletonTransition({
  isLoading,
  skeleton,
  children,
  className,
}: SkeletonTransitionProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Skeleton layer */}
      <div
        className={cn(
          "transition-all duration-300 ease-out",
          isLoading 
            ? "opacity-100" 
            : "opacity-0 pointer-events-none absolute inset-0"
        )}
        aria-hidden={!isLoading}
      >
        {skeleton}
      </div>

      {/* Content layer - render immediately when not loading */}
      <div
        className={cn(
          "transition-opacity duration-200 ease-out",
          isLoading ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Simple fade-in wrapper for content that was previously showing a skeleton.
 * Use this to wrap content sections for smooth appearance.
 */
export function ContentFadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("content-loaded", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Staggered fade-in for list items after skeleton loading.
 * Each child gets a progressively longer delay for a cascade effect.
 */
export function StaggeredFadeIn({
  children,
  className,
  baseDelay = 50,
}: {
  children: ReactNode[];
  className?: string;
  baseDelay?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="content-loaded"
          style={{ animationDelay: `${index * baseDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
