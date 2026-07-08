import { Skeleton } from "@/components/ui/skeleton";

// Header skeleton matching the app header layout
const HeaderSkeleton = () => (
  <div className="h-16 border-b border-border bg-background/80 backdrop-blur-sm px-4 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-8 rounded-lg" />
      <Skeleton className="h-5 w-24" />
    </div>
    <div className="hidden md:flex items-center gap-6">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="flex items-center gap-3">
      <Skeleton className="h-9 w-20 rounded-lg" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
  </div>
);

// Page title section skeleton
const PageTitleSkeleton = () => (
  <div className="mb-10">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  </div>
);

// Filter bar skeleton
const FiltersSkeleton = () => (
  <div className="flex flex-wrap gap-3 mb-8">
    <Skeleton className="h-10 w-32 rounded-lg" />
    <Skeleton className="h-10 w-40 rounded-lg" />
    <Skeleton className="h-10 w-36 rounded-lg" />
    <Skeleton className="h-10 w-28 rounded-lg" />
  </div>
);

// Card grid skeleton for listing pages
const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card-sketch p-0 overflow-hidden">
        <Skeleton className="h-40 w-full rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// List skeleton for detail pages
const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card-sketch flex items-center gap-4 p-4">
        <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    ))}
  </div>
);

// Detail page skeleton
const DetailSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-64 w-full rounded-xl" />
    <div className="space-y-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
    </div>
    <div className="flex gap-3">
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  </div>
);

// Dashboard skeleton
const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Stats grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card-sketch p-4">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    {/* Content sections */}
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card-sketch p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <ListSkeleton count={3} />
      </div>
      <div className="card-sketch p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <ListSkeleton count={3} />
      </div>
    </div>
  </div>
);

// Full page skeleton combining header and content
interface PageSkeletonProps {
  variant?: "grid" | "list" | "detail" | "dashboard";
  showFilters?: boolean;
}

export const PageSkeleton = ({ variant = "grid", showFilters = true }: PageSkeletonProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <HeaderSkeleton />
      <main className="flex-1 container-wide py-8">
        <PageTitleSkeleton />
        {showFilters && <FiltersSkeleton />}
        {variant === "grid" && <CardGridSkeleton />}
        {variant === "list" && <ListSkeleton />}
        {variant === "detail" && <DetailSkeleton />}
        {variant === "dashboard" && <DashboardSkeleton />}
      </main>
    </div>
  );
};

// Export individual components for custom compositions
export {
  HeaderSkeleton,
  PageTitleSkeleton,
  FiltersSkeleton,
  CardGridSkeleton,
  ListSkeleton,
  DetailSkeleton,
  DashboardSkeleton,
};
