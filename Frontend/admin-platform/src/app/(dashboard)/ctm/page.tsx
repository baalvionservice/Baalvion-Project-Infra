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

export default function CtmAdminPage() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'ControlTheMarket' }]); }, [setBreadcrumbs]);

  const { data, isLoading } = useQuery({
    queryKey: ['ctm', 'tasks'],
    queryFn: () => serviceClients.ctm.get('/tasks', { params: { limit: 50 } }).then((r) => r.data),
  });
  const tasks = extractRows(data);

  return (
    <div className="space-y-6">
      <PageHeader title="ControlTheMarket (SkillMatch Pro)" description="Talent challenges & submissions (ctm-service)" />
      <Card>
        <CardHeader><CardTitle>Tasks ({tasks.length})</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : tasks.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No tasks found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Difficulty</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr></thead>
                <tbody>
                  {tasks.map((t, i) => (
                    <tr key={String(t.id ?? i)} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{String(t.title ?? t.name ?? '—')}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{String(t.difficulty ?? t.level ?? '—')}</td>
                      <td className="py-2 pr-4"><Badge className="bg-gray-100 text-gray-600">{String(t.status ?? '—')}</Badge></td>
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
