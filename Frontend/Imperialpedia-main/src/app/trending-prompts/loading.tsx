import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/design-system/layout/container';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background pb-32" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading trending prompts</span>
      <div className="pt-16">
        <Container>
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/2" />
        </Container>
      </div>
      <div className="pt-6">
        <Container>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
        </Container>
      </div>
      <Container className="pt-10">
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
