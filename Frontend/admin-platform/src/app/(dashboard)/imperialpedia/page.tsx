'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';

function extractRows(d: unknown): Record<string, unknown>[] {
  const env = d as { data?: unknown } | undefined;
  const x = (env && 'data' in env ? env.data : env) as unknown;
  if (Array.isArray(x)) return x as Record<string, unknown>[];
  const items = (x as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

export default function ImperialpediaAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Imperialpedia' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['imperialpedia', 'entities'],
    queryFn: () => serviceClients.imperialpedia.get('/entities', { params: { limit: 50 } }).then((r) => r.data),
  });
  const entities = extractRows(data);

  return (
    <div className="space-y-6">
      <PageHeader title="Imperialpedia" description="Structured entities & editorial content (imperialpedia-service)" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/imperialpedia/glossary"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Glossary →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Investopedia-style financial terms — definitions, formulas, examples, related terms.
          </p>
        </Link>
        <Link
          href="/imperialpedia/entities"
          className="rounded-lg border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-accent"
        >
          <div className="font-semibold">Entities →</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured knowledge-graph entities — companies, people, places keyed by type and slug.
          </p>
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Entities ({entities.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : entities.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No entities found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {entities.map((e, i) => (
                    <tr key={String(e.id ?? i)} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{String(e.name ?? e.title ?? '—')}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{String(e.type ?? e.entity_type ?? '—')}</td>
                      <td className="py-2 pr-4"><Badge className="bg-gray-100 text-gray-600">{String(e.status ?? 'published')}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
