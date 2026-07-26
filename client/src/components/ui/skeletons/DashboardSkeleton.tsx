import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="space-y-8">
      <div className="rounded-[24px] border border-[#d0d4e4] bg-white p-8 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-start gap-4 rounded-[16px] border border-[#d0d4e4] p-4"
            >
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
              <Skeleton className="h-10 w-28 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[16px]" />
        ))}
      </div>
    </div>
  );
}
