import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn("rounded-md bg-muted skeleton-optimized", className)} 
      {...props} 
    />
  );
}

export { Skeleton };
