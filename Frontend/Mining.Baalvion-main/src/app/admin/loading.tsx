import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Admin Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-10 w-72 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-48 rounded-md bg-slate-200" />
        </div>
      </div>

      {/* High-Level Admin Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none shadow-sm h-32">
            <CardContent className="p-6 flex items-center gap-4 h-full">
              <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-28" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Admin Content Area */}
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="border-b bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="h-[400px] flex items-center justify-center">
            <div className="w-full h-full p-8 flex items-end gap-4">
              {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                <Skeleton key={i} className="flex-1 bg-slate-100 rounded-t-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-slate-900 overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-24 bg-slate-800" />
                    <Skeleton className="h-3 w-12 bg-slate-800" />
                  </div>
                  <Skeleton className="h-1.5 w-full bg-slate-800" />
                </div>
              ))}
              <Skeleton className="h-12 w-full bg-slate-800 rounded-xl" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Admin Log / Table Skeleton */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="p-0">
          <div className="h-12 bg-slate-50 border-b flex items-center px-6">
            <Skeleton className="h-4 w-32" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 border-b last:border-none flex items-center px-6 justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
