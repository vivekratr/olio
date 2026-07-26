import { Skeleton } from "@/components/ui/Skeleton";

export function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading form" className="space-y-6">
      <Skeleton className="h-10 w-1/3" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[520px] rounded-[24px]" />
        <Skeleton className="h-[520px] rounded-[24px]" />
      </div>
    </div>
  );
}
