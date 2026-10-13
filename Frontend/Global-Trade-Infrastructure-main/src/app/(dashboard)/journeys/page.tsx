'use client';

/**
 * @file journeys/page.tsx
 * @description Every order the signed-in organisation is a party to, as a plain list. Each row opens
 * the order's journey: what has happened, what is next, and who has to act.
 */
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Workflow } from 'lucide-react';
import { journeyService } from '@/services/journey-service';
import { roleLabel, routeLabel } from '@/lib/journey-labels';
import { EmptyState, InlineError, PageHeader, Panel, PanelSkeleton } from '@/components/dashboard/dashboard-kit';

export default function JourneysPage() {
  const q = useQuery({ queryKey: ['journeys', 'mine'], queryFn: journeyService.list, retry: 1, staleTime: 30_000, refetchInterval: 60_000 });

  return (
    <main id="journeys" className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader title="Order journeys" description="Every order you are part of, from confirmation to delivery." />
      <Panel title="Your orders">
        {q.isLoading && <PanelSkeleton />}
        {q.isError && <InlineError message="We couldn't load your orders." onRetry={() => void q.refetch()} />}
        {q.data && q.data.length === 0 && (
          <EmptyState icon={Workflow} title="No orders yet" description="When an order you are part of is confirmed, its journey appears here." />
        )}
        {q.data && q.data.length > 0 && (
          <ul className="divide-y">
            {q.data.map((j) => (
              <li key={j.id}>
                <Link href={`/journeys/${j.id}`} className="flex min-h-14 items-center gap-3 py-3 hover:bg-accent/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium">{j.reference_no}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {routeLabel(j.origin_country, j.destination_country)}
                      {j.commodity ? ` · ${j.commodity}` : ''} · You are the {roleLabel(j.myRole).toLowerCase()}
                    </p>
                  </div>
                  <ArrowRight aria-hidden className="h-5 w-5 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </main>
  );
}
