import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  type: "table" | "chart" | "card" | "feed" | "stats";
  count?: number;
}

const LoadingSkeleton = ({ type, count = 3 }: LoadingSkeletonProps) => {
  if (type === "table") {
    return (
      <div className="space-y-4 p-4 animate-pulse">
        <div className="flex gap-4 border-b border-border pb-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 flex-1 bg-muted/50" />
          ))}
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex gap-4 py-3">
            <Skeleton className="h-10 w-10 rounded-full bg-muted/50" />
            <Skeleton className="h-4 flex-1 bg-muted/50" />
            <Skeleton className="h-4 w-20 bg-muted/50" />
            <Skeleton className="h-4 w-24 bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "chart") {
    return (
      <div className="p-6 animate-pulse">
        <div className="flex items-end gap-2 h-48 justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-8 bg-muted/50 rounded-t"
              style={{ height: `${Math.random() * 100 + 40}px` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-4">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <Skeleton key={day} className="h-3 w-8 bg-muted/50" />
          ))}
        </div>
      </div>
    );
  }

  if (type === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-lg bg-muted/50" />
              <Skeleton className="h-4 w-12 bg-muted/50" />
            </div>
            <Skeleton className="h-3 w-20 mb-2 bg-muted/50" />
            <Skeleton className="h-6 w-24 bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "feed") {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-6 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full bg-muted/50" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2 bg-muted/50" />
                <Skeleton className="h-3 w-20 bg-muted/50" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2 bg-muted/50" />
            <Skeleton className="h-4 w-3/4 mb-4 bg-muted/50" />
            <div className="flex gap-6">
              <Skeleton className="h-4 w-12 bg-muted/50" />
              <Skeleton className="h-4 w-12 bg-muted/50" />
              <Skeleton className="h-4 w-12 bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "stats") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-card border border-border text-center">
            <Skeleton className="h-8 w-16 mx-auto mb-2 bg-muted/50" />
            <Skeleton className="h-3 w-20 mx-auto bg-muted/50" />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default LoadingSkeleton;
