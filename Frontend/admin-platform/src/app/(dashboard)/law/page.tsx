'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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

export default function LawAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'Law Elite' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['law', 'lawyers'],
    queryFn: () => serviceClients.law.get('/lawyers', { params: { limit: 50 } }).then((r) => r.data),
  });
  const lawyers = extractRows(data);

  return (
    <div className="space-y-6">
      <PageHeader title="Law Elite Network" description="Lawyers, verification & moderation (law-service)" />
      <Card>
        <CardHeader><CardTitle>Lawyers ({lawyers.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : lawyers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No lawyers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Practice Area</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {lawyers.map((l, i) => (
                    <tr key={String(l.id ?? i)} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{String(l.name ?? l.full_name ?? '—')}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{String(l.specialization ?? l.practice_area ?? l.email ?? '—')}</td>
                      <td className="py-2 pr-4">
                        <Badge className={l.verified || l.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                          {String(l.status ?? (l.verified ? 'verified' : 'pending'))}
                        </Badge>
                      </td>
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
