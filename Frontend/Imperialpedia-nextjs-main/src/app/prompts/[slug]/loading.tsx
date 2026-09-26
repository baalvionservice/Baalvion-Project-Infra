import { Skeleton } from '@/components/ui/skeleton';
import { Container } from '@/design-system/layout/container';
import { Section } from '@/design-system/layout/section';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background pt-16 pb-32" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading prompt</span>
      <Section spacing="md">
        <Container className="max-w-3xl">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-2/3 mb-10" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4 mb-16">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="aspect-[4/3] w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-9 w-40" />
            </div>
          ))}
        </Container>
      </Section>
    </main>
  );
}
