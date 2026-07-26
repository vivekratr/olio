import { Skeleton } from "@/components/ui/Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  label?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  label = "Loading table",
}: TableSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
    >
      <div className="flex gap-4 border-b border-[#d0d4e4] bg-[#f5f6f8] px-4 py-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton
            key={`head-${index}`}
            className="h-4 flex-1 rounded-md"
          />
        ))}
      </div>
      <div className="divide-y divide-[#d0d4e4]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                className={`h-4 flex-1 rounded-md ${colIndex === 0 ? "max-w-[40%]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
