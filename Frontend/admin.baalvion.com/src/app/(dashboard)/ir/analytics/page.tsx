'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileBarChart, FolderArchive, FileCheck, CalendarDays, Users2, Download } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports } from '@/lib/queries/ir-reports.queries';
import { useDocuments, useFilings, useEvents, useShareholders } from '@/lib/queries/ir-modules.queries';
import { useUIStore } from '@/lib/store/uiStore';

export default function IrAnalyticsPage() {
  const { setBreadcrumbs } = useUIStore();
  const reports = useReports({ page: 1, limit: 200 });
  const docs = useDocuments({ page: 1, limit: 200 });
  const filings = useFilings({ page: 1, limit: 200 });
  const events = useEvents({ page: 1, limit: 200 });
  const holders = useShareholders({ page: 1, limit: 500 });

  useEffect(() => { setBreadcrumbs([{ label: 'Investor Relations', href: '/ir' }, { label: 'Analytics' }]); }, [setBreadcrumbs]);

  const r = reports.data?.items ?? [];
  const d = docs.data?.items ?? [];
  const f = filings.data?.items ?? [];
  const e = events.data?.items ?? [];
  const h = holders.data?.items ?? [];
  const totalDownloads = [...r, ...d].reduce((s, x: any) => s + (Number(x.downloads_count) || 0), 0);
  const upcoming = e.filter((x) => x.status === 'upcoming').length;
  const ownership = h.reduce((s, x) => s + (Number(x.ownership_pct) || 0), 0);
  const loading = reports.isLoading || docs.isLoading;

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild><Link href="/ir"><ArrowLeft className="mr-1 h-4 w-4" />Investor Relations</Link></Button>
      <PageHeader title="IR Analytics" description="Activity across all investor-relations content." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Reports published" value={r.filter((x) => x.status === 'published').length} icon={FileBarChart} isLoading={loading} format="raw" />
        <KpiCard title="Documents" value={d.length} icon={FolderArchive} iconColor="text-violet-500" isLoading={loading} format="raw" />
        <KpiCard title="Filings" value={f.length} icon={FileCheck} iconColor="text-rose-500" isLoading={loading} format="raw" />
        <KpiCard title="Total downloads" value={totalDownloads} icon={Download} iconColor="text-green-600" isLoading={loading} format="raw" />
        <KpiCard title="Upcoming events" value={upcoming} icon={CalendarDays} iconColor="text-amber-500" isLoading={loading} format="raw" />
        <KpiCard title="Shareholders" value={h.length} icon={Users2} iconColor="text-cyan-500" isLoading={loading} format="raw" />
        <KpiCard title="Tracked ownership" value={`${ownership.toFixed(1)}%`} icon={Users2} iconColor="text-cyan-500" isLoading={loading} format="raw" />
        <KpiCard title="Total reports" value={r.length} icon={FileBarChart} isLoading={loading} format="raw" />
      </div>

      <Card className="mt-6">
        <CardHeader className="pb-3"><CardTitle className="text-sm">Most downloaded</CardTitle></CardHeader>
        <CardContent>
          {[...r, ...d].filter((x: any) => Number(x.downloads_count) > 0).sort((a: any, b: any) => (b.downloads_count || 0) - (a.downloads_count || 0)).slice(0, 8).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No downloads recorded yet.</p>
          ) : (
            <div className="divide-y">
              {[...r, ...d].filter((x: any) => Number(x.downloads_count) > 0).sort((a: any, b: any) => (b.downloads_count || 0) - (a.downloads_count || 0)).slice(0, 8).map((x: any) => (
                <div key={x.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="truncate">{x.title}</span>
                  <span className="text-muted-foreground">{x.downloads_count} downloads</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-muted-foreground">
        Web traffic / pageview analytics integrate with the platform Analytics service — see the global <Link href="/analytics" className="underline">Analytics</Link> console.
      </p>
    </div>
  );
}
