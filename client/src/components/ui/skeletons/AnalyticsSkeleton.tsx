import { Skeleton } from "@/components/ui/Skeleton";

export function AnalyticsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading analytics" className="space-y-8">
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[24px]" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[24px]" />
        ))}
      </div>
    </div>
  );
}
