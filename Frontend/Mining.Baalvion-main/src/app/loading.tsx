import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";

// Public pages each render their own Navbar, so the fallback renders it too —
// otherwise the chrome disappears for the length of the transition.
export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main
        role="status"
        aria-live="polite"
        aria-busy="true"
        className="flex-1"
      >
        <span className="sr-only">Loading</span>

        <section className="bg-primary py-16 lg:py-32">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-7 w-64 rounded-full bg-primary-foreground/20" />
            <Skeleton className="h-14 w-full max-w-3xl bg-primary-foreground/20" />
            <Skeleton className="h-14 w-2/3 max-w-xl bg-primary-foreground/20" />
            <Skeleton className="h-5 w-full max-w-xl bg-primary-foreground/10" />
            <div className="flex flex-wrap gap-4 pt-4">
              <Skeleton className="h-12 w-48 bg-primary-foreground/20" />
              <Skeleton className="h-12 w-40 bg-primary-foreground/10" />
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="container px-4 md:px-8 max-w-7xl mx-auto space-y-10">
            <div className="space-y-3 max-w-2xl">
              <Skeleton className="h-9 w-80" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
