import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Text Page Skeleton - For Terms, Privacy, FAQ, etc.
 * Mobile: Simplified with fewer paragraph lines
 */
export const TextPageSkeleton = memo(function TextPageSkeleton() {
  return (
    <div className="py-8 md:py-14">
      <div className="container-wide max-w-4xl px-4">
        {/* Header - Smaller on mobile */}
        <div className="mb-6 md:mb-10 text-center">
          <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl mx-auto mb-3 md:mb-4" />
          <Skeleton className="h-6 md:h-8 w-48 md:w-64 mx-auto mb-2" />
          <Skeleton className="h-3 md:h-4 w-32 md:w-48 mx-auto" />
        </div>

        {/* Content Card */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-8 space-y-6 md:space-y-8">
            {/* Introduction - Fewer lines on mobile */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full hidden md:block" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* Section 1 */}
            <div className="space-y-2 md:space-y-3">
              <Skeleton className="h-5 md:h-6 w-40 md:w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 hidden md:block" />
            </div>

            {/* Section 2 - Hidden on mobile */}
            <div className="space-y-3 hidden md:block">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* List items - 2 on mobile, 3 on desktop */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex items-start gap-2">
                <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex items-start gap-2 hidden md:flex">
                <Skeleton className="w-2 h-2 rounded-full mt-2 flex-shrink-0" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/**
 * FAQ Page Skeleton - Accordion style
 * Mobile: 2 sections, 2 items each
 */
export const FAQPageSkeleton = memo(function FAQPageSkeleton() {
  return (
    <main className="flex-grow container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header - Compact on mobile */}
        <div className="text-center mb-6 md:mb-10">
          <Skeleton className="h-5 md:h-6 w-20 md:w-24 mx-auto mb-3 md:mb-4 rounded-full" />
          <Skeleton className="h-8 md:h-10 w-64 md:w-80 mx-auto mb-2 md:mb-3" />
          <Skeleton className="h-4 w-72 md:w-96 mx-auto hidden md:block" />
        </div>

        {/* FAQ Sections - 2 on mobile, 4 on desktop */}
        <div className="space-y-4 md:space-y-6">
          {Array.from({ length: 2 }).map((_, sectionIndex) => (
            <Card key={sectionIndex} className="border-border">
              <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3">
                  <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-lg" />
                  <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-2 md:space-y-3 px-4 md:px-6 pb-4 md:pb-6">
                {Array.from({ length: 2 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="py-2 md:py-3 border-b border-muted last:border-0">
                    <Skeleton className="h-4 md:h-5 w-4/5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {/* Extra sections on desktop only */}
          <div className="hidden md:block space-y-6">
            {Array.from({ length: 2 }).map((_, sectionIndex) => (
              <Card key={`desktop-${sectionIndex}`} className="border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {Array.from({ length: 3 }).map((_, itemIndex) => (
                    <div key={itemIndex} className="py-3 border-b border-muted last:border-0">
                      <Skeleton className="h-5 w-4/5" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
});

/**
 * Listing Page Skeleton - For Books, Materials, Events, etc.
 * Mobile: 2 cards, Desktop: 6 cards
 */
export const ListingPageSkeleton = memo(function ListingPageSkeleton() {
  return (
    <div className="pb-20 md:pb-0">
      <main className="py-6 md:py-14">
        <div className="container-wide px-4">
          {/* Header - Compact on mobile */}
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl" />
              <div className="space-y-1 md:space-y-2">
                <Skeleton className="h-6 md:h-8 w-32 md:w-48" />
                <Skeleton className="h-3 md:h-4 w-48 md:w-64 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Search & Filters - Simplified on mobile */}
          <div className="flex flex-col gap-2 md:gap-3 mb-6 md:mb-8">
            <Skeleton className="h-10 w-full md:max-w-md rounded-lg" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Skeleton className="h-9 md:h-10 w-24 md:w-32 rounded-lg flex-shrink-0" />
              <Skeleton className="h-9 md:h-10 w-20 md:w-28 rounded-lg flex-shrink-0" />
              <Skeleton className="h-9 md:h-10 w-28 md:w-36 rounded-lg flex-shrink-0 hidden sm:block" />
            </div>
          </div>

          {/* Cards Grid - 2 on mobile, 6 on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Always show 2 cards */}
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-36 md:h-48 w-full rounded-none" />
                <CardContent className="p-3 md:p-5 space-y-2 md:space-y-3">
                  <Skeleton className="h-4 md:h-5 w-3/4" />
                  <Skeleton className="h-3 md:h-4 w-full hidden md:block" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 md:h-6 w-14 md:w-16 rounded-full" />
                    <Skeleton className="h-5 md:h-6 w-16 md:w-20 rounded-full hidden sm:block" />
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Extra cards on larger screens */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`extra-${i}`} className="overflow-hidden hidden sm:block">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
});

/**
 * Task/Project Listing Skeleton
 * Mobile: 2 cards, Desktop: 6 cards
 */
export const TaskListingSkeleton = memo(function TaskListingSkeleton() {
  return (
    <div className="py-6 md:py-8">
      <div className="container-wide px-4">
        {/* Header - Compact on mobile */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 md:gap-3">
                <Skeleton className="w-6 h-6 md:w-8 md:h-8 rounded" />
                <Skeleton className="h-6 md:h-8 w-28 md:w-40" />
              </div>
              <Skeleton className="h-3 md:h-4 w-40 md:w-56 mt-1 md:mt-2 hidden sm:block" />
            </div>
            <Skeleton className="h-9 md:h-10 w-28 md:w-32 rounded-lg" />
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-4 md:mb-6">
          <Skeleton className="h-9 md:h-10 w-48 md:w-64 rounded-lg" />
        </div>

        {/* Cards Grid - 2 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                <Skeleton className="h-4 md:h-5 w-14 md:w-16 rounded-full" />
                <Skeleton className="h-4 md:h-5 w-4/5" />
                <div className="space-y-1 md:space-y-2">
                  <Skeleton className="h-3 md:h-4 w-28 md:w-32" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Skeleton className="h-5 md:h-6 w-14 md:w-16 rounded" />
                  <Skeleton className="h-7 md:h-8 w-14 md:w-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
          {/* Extra cards on desktop */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={`extra-${i}`} className="border-border hidden md:block">
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-4/5" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
});

/**
 * Detail Page Skeleton - For single item view
 * Mobile: Stacked layout, Desktop: Side-by-side
 */
export const DetailPageSkeleton = memo(function DetailPageSkeleton() {
  return (
    <div className="pb-20 md:pb-0">
      <main className="py-6 md:py-12">
        <div className="container-wide px-4">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              <Skeleton className="aspect-[4/3] md:aspect-square w-full rounded-lg md:rounded-xl max-h-72 md:max-h-96" />
              <div className="space-y-2 md:space-y-3">
                <Skeleton className="h-6 md:h-8 w-3/4" />
                <Skeleton className="h-4 md:h-5 w-1/2 hidden md:block" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 md:h-6 w-16 md:w-20 rounded-full" />
                  <Skeleton className="h-5 md:h-6 w-20 md:w-24 rounded-full hidden sm:block" />
                </div>
              </div>
              <div className="space-y-2 hidden md:block">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Sidebar - Hidden on mobile, shown as inline on mobile */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                  <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
                  <div className="space-y-1 md:space-y-2">
                    <Skeleton className="h-3 md:h-4 w-full" />
                    <Skeleton className="h-3 md:h-4 w-3/4 hidden md:block" />
                  </div>
                  <Skeleton className="h-9 md:h-10 w-full rounded-lg" />
                </CardContent>
              </Card>
              <Card className="hidden md:block">
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
});

/**
 * Dashboard Skeleton
 * Mobile: 2 stat cards, simplified content
 */
export const DashboardPageSkeleton = memo(function DashboardPageSkeleton() {
  return (
    <div className="py-6 md:py-8">
      <div className="container-wide px-4">
        {/* Stats Grid - 2 on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3 md:p-4">
                <Skeleton className="h-3 md:h-4 w-16 md:w-20 mb-1 md:mb-2" />
                <Skeleton className="h-6 md:h-8 w-12 md:w-16" />
              </CardContent>
            </Card>
          ))}
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={`extra-${i}`} className="hidden md:block">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content - Single column on mobile */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
              <Skeleton className="h-5 md:h-6 w-24 md:w-32" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 md:gap-4 py-1 md:py-2">
                  <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg" />
                  <div className="flex-1 space-y-1 md:space-y-2">
                    <Skeleton className="h-3 md:h-4 w-3/4" />
                    <Skeleton className="h-2 md:h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="hidden md:block">
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

/**
 * Contact Page Skeleton
 * Mobile: Compact form
 */
export const ContactPageSkeleton = memo(function ContactPageSkeleton() {
  return (
    <div className="py-8 md:py-14">
      <div className="container-wide max-w-2xl px-4">
        {/* Header */}
        <div className="mb-6 md:mb-10 text-center">
          <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl mx-auto mb-3 md:mb-4" />
          <Skeleton className="h-6 md:h-8 w-32 md:w-40 mx-auto mb-2" />
          <Skeleton className="h-3 md:h-4 w-56 md:w-72 mx-auto hidden sm:block" />
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-4 md:p-8 space-y-4 md:space-y-6">
            <div className="grid md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1 md:space-y-2">
                <Skeleton className="h-3 md:h-4 w-12 md:w-16" />
                <Skeleton className="h-9 md:h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-1 md:space-y-2">
                <Skeleton className="h-3 md:h-4 w-10 md:w-12" />
                <Skeleton className="h-9 md:h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-1 md:space-y-2">
              <Skeleton className="h-3 md:h-4 w-14 md:w-16" />
              <Skeleton className="h-9 md:h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1 md:space-y-2">
              <Skeleton className="h-3 md:h-4 w-16 md:w-20" />
              <Skeleton className="h-24 md:h-32 w-full rounded-lg" />
            </div>
            <Skeleton className="h-9 md:h-10 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/**
 * Events Page Skeleton
 * Mobile: 2 cards
 */
export const EventsPageSkeleton = memo(function EventsPageSkeleton() {
  return (
    <div className="pb-20 md:pb-0">
      <main className="py-6 md:py-14">
        <div className="container-wide px-4">
          {/* Header */}
          <div className="mb-6 md:mb-10">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl" />
              <div className="space-y-1 md:space-y-2">
                <Skeleton className="h-6 md:h-8 w-24 md:w-32" />
                <Skeleton className="h-3 md:h-4 w-40 md:w-56 hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Filters - Simplified on mobile */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            <Skeleton className="h-9 md:h-10 w-full sm:w-64 rounded-lg" />
            <Skeleton className="h-9 md:h-10 w-24 md:w-32 rounded-lg hidden sm:block" />
          </div>

          {/* Events Grid - 2 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] md:aspect-square w-full rounded-none" />
                <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
                  <Skeleton className="h-4 md:h-5 w-3/4" />
                  <Skeleton className="h-5 w-16 md:w-20 rounded-full" />
                  <div className="space-y-1 md:space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 md:h-4 w-3 md:w-4 rounded" />
                      <Skeleton className="h-3 md:h-4 w-28 md:w-36" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Extra cards on desktop */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`extra-${i}`} className="overflow-hidden hidden sm:block">
                <Skeleton className="aspect-square w-full rounded-none" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-4 rounded" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
});

/**
 * Leaderboard Page Skeleton
 * Mobile: Compact top 3, fewer list items
 */
export const LeaderboardPageSkeleton = memo(function LeaderboardPageSkeleton() {
  return (
    <div className="py-6 md:py-8">
      <div className="container-wide max-w-3xl px-4">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl mx-auto mb-3 md:mb-4" />
          <Skeleton className="h-6 md:h-8 w-32 md:w-40 mx-auto mb-2" />
          <Skeleton className="h-3 md:h-4 w-48 md:w-64 mx-auto hidden sm:block" />
        </div>

        {/* Top 3 - Smaller on mobile */}
        <div className="flex justify-center gap-2 md:gap-4 mb-6 md:mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="w-20 md:w-28">
              <CardContent className="p-2 md:p-4 text-center">
                <Skeleton className="w-10 h-10 md:w-16 md:h-16 rounded-full mx-auto mb-1 md:mb-2" />
                <Skeleton className="h-3 md:h-4 w-12 md:w-16 mx-auto mb-1" />
                <Skeleton className="h-2 md:h-3 w-8 md:w-12 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* List - 4 on mobile, 7 on desktop */}
        <Card>
          <CardContent className="p-3 md:p-4 space-y-2 md:space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-4 py-1 md:py-2">
                <Skeleton className="w-6 h-6 md:w-8 md:h-8 rounded-full" />
                <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 md:h-4 w-24 md:w-32" />
                  <Skeleton className="h-2 md:h-3 w-16 md:w-24 hidden sm:block" />
                </div>
                <Skeleton className="h-5 md:h-6 w-12 md:w-16 rounded-full" />
              </div>
            ))}
            {/* Extra items on desktop */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`extra-${i}`} className="hidden md:flex items-center gap-4 py-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

/**
 * Home/Index Page Skeleton
 * Mobile: Simplified hero, fewer features
 */
export const HomePageSkeleton = memo(function HomePageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Compact on mobile */}
      <div className="py-12 md:py-24">
        <div className="container-wide text-center px-4">
          <Skeleton className="h-8 md:h-12 w-4/5 md:w-3/4 max-w-2xl mx-auto mb-3 md:mb-4" />
          <Skeleton className="h-5 md:h-6 w-3/4 md:w-2/3 max-w-xl mx-auto mb-6 md:mb-8 hidden sm:block" />
          <div className="flex justify-center gap-3 md:gap-4">
            <Skeleton className="h-10 md:h-12 w-28 md:w-32 rounded-lg" />
            <Skeleton className="h-10 md:h-12 w-28 md:w-32 rounded-lg hidden sm:block" />
          </div>
        </div>
      </div>

      {/* Stats Section - 2 on mobile */}
      <div className="py-6 md:py-8 bg-muted/30">
        <div className="container-wide px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 md:h-10 w-16 md:w-20 mx-auto mb-1 md:mb-2" />
                <Skeleton className="h-3 md:h-4 w-20 md:w-24 mx-auto" />
              </div>
            ))}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={`extra-${i}`} className="text-center hidden md:block">
                <Skeleton className="h-10 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section - 2 on mobile */}
      <div className="py-12 md:py-16">
        <div className="container-wide px-4">
          <Skeleton className="h-6 md:h-8 w-36 md:w-48 mx-auto mb-6 md:mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 md:p-6">
                  <Skeleton className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl mb-3 md:mb-4" />
                  <Skeleton className="h-5 md:h-6 w-24 md:w-32 mb-2" />
                  <Skeleton className="h-3 md:h-4 w-full" />
                </CardContent>
              </Card>
            ))}
            {/* Extra features on desktop */}
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={`extra-${i}`} className="hidden sm:block">
                <CardContent className="p-6">
                  <Skeleton className="w-12 h-12 rounded-xl mb-4" />
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
