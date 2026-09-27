import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/design-system/layout/container';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background pb-32" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading prompts</span>
      <div className="border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-primary/5 to-transparent pt-20 pb-12">
        <Container>
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Container>
      </div>
      <div className="pt-2"><Container><div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div></Container></div>
      <Container className="pt-10">
        <Skeleton className="mb-10 h-11 max-w-xl w-full rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/2] w-full rounded-md" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
