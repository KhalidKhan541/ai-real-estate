import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
  animate?: boolean;
}

function Skeleton({
  className,
  variant = "text",
  width,
  height,
  lines,
  animate = true,
  style,
  ...props
}: SkeletonProps) {
  if (lines) {
    return (
      <div className={cn("space-y-2", className)} style={style} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-gray-200 dark:bg-gray-700",
              animate && "animate-pulse",
              i === lines - 1 ? "w-3/4" : "w-full"
            )}
            style={{
              height: height || 16,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        animate && "animate-pulse",
        variant === "text" && "h-4 w-full rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-none",
        variant === "rounded" && "rounded-lg",
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <Skeleton variant="rectangular" className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" className="h-5 w-1/3" />
        <Skeleton variant="text" className="h-4 w-3/4" />
        <Skeleton variant="text" className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton variant="rounded" className="h-6 w-16" />
          <Skeleton variant="rounded" className="h-6 w-16" />
          <Skeleton variant="rounded" className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className="h-4"
          style={{ width: `${100 / columns}%` }}
        />
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="rounded" className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
          >
            <Skeleton variant="text" className="h-4 w-20" />
            <Skeleton variant="text" className="mt-2 h-8 w-32" />
            <Skeleton variant="text" className="mt-1 h-3 w-24" />
          </div>
        ))}
      </div>
      <Skeleton variant="rectangular" className="h-64 w-full rounded-xl" />
    </div>
  );
}

export { Skeleton, PropertyCardSkeleton, TableRowSkeleton, DashboardSkeleton };
