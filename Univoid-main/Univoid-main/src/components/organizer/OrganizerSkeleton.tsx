import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrganizerDashboardSkeleton() {
  return (
    <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Events List */}
        <div className="lg:col-span-1 space-y-2">
          <Skeleton className="h-4 w-24 mb-3" />
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Event Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export function RegistrationListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-8 w-24 flex-1 sm:flex-none" />
              <Skeleton className="h-8 w-24 flex-1 sm:flex-none" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
