interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-[#dddfeb] motion-reduce:animate-none ${className}`}
    />
  );
}
