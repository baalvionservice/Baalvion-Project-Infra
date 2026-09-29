'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  FileBarChart,
  FileText,
  CheckCircle2,
  Clock3,
  Plus,
  Newspaper,
  ExternalLink,
  ArrowRight,
  Mic,
  CalendarDays,
  FileCheck,
  FolderArchive,
  Users2,
  LineChart,
  CandlestickChart,
  BarChart3,
} from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import KpiCard from '@/components/common/KpiCard';
import StatusBadge from '@/components/common/StatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useReports } from '@/lib/queries/ir-reports.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import { IR_REPORT_TYPE_LABELS, formatReportPeriod } from '@/lib/types/ir.types';

const IR_SITE = 'https://ir.baalvion.com';
const NEWSROOM_HREF = '/cms/websites/ir.baalvion.com';

export default function IrOverviewPage() {
  const { setBreadcrumbs } = useUIStore();
  // One call powers the whole overview. Pull a wide page so the KPI counts reflect
  // the full set rather than just the first page.
  const { data, isLoading } = useReports({ page: 1, limit: 100 });

  useEffect(() => {
    setBreadcrumbs([{ label: 'Investor Relations' }]);
  }, [setBreadcrumbs]);

  const reports = data?.items ?? [];
  const total = data?.total ?? reports.length;
  const published = reports.filter((r) => r.status === 'published').length;
  const inReview = reports.filter((r) => r.status === 'review').length;
  const drafts = reports.filter((r) => r.status === 'draft').length;
  const recent = [...reports]
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Investor Relations"
        description="Manage disclosures, financial reports and investor communications for ir.baalvion.com."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={IR_SITE} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View live site
              </a>
            </Button>
            <Button size="sm" asChild>
              <Link href="/ir/financials/new">
                <Plus className="mr-2 h-4 w-4" />
                New report
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPIs — all derived from live reports */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard title="Total reports" value={total} icon={FileBarChart} isLoading={isLoading} format="raw" />
        <KpiCard title="Live on site" value={published} icon={CheckCircle2} iconColor="text-green-600" isLoading={isLoading} format="raw" />
        <KpiCard title="In review" value={inReview} icon={Clock3} iconColor="text-amber-500" isLoading={isLoading} format="raw" />
        <KpiCard title="Drafts" value={drafts} icon={FileText} iconColor="text-muted-foreground" isLoading={isLoading} format="raw" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent reports */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm">Recent reports</CardTitle>
              <CardDescription className="text-xs">Latest financial reports, newest first.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ir/financials">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <p className="mb-3 text-sm text-muted-foreground">No reports yet.</p>
                <Button size="sm" asChild>
                  <Link href="/ir/financials/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first report
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    href={`/ir/financials/${r.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/50 -mx-2 px-2 rounded-md"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {IR_REPORT_TYPE_LABELS[r.report_type]} · {formatReportPeriod(r)} · updated {formatDate(r.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Quick actions</CardTitle>
            <CardDescription className="text-xs">Jump straight to the most common tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/ir/financials/new"><Plus className="mr-2 h-4 w-4 text-blue-500" /> New financial report</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/ir/financials"><FileBarChart className="mr-2 h-4 w-4 text-violet-500" /> Financial Reports Center</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={NEWSROOM_HREF}><Newspaper className="mr-2 h-4 w-4 text-rose-500" /> Newsroom (press &amp; news)</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* All modules */}
      <div>
        <h2 className="mb-3 text-sm font-semibold">All modules</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[
            { title: 'Financial Reports', desc: 'Quarterly & annual results', href: '/ir/financials', icon: FileBarChart, color: 'text-blue-500' },
            { title: 'Earnings', desc: 'Calls, webcasts & transcripts', href: '/ir/earnings', icon: Mic, color: 'text-green-500' },
            { title: 'Events & Calendar', desc: 'AGM, investor days, roadshows', href: '/ir/events', icon: CalendarDays, color: 'text-amber-500' },
            { title: 'Regulatory Filings', desc: '10-K, 10-Q, 8-K, proxies', href: '/ir/filings', icon: FileCheck, color: 'text-rose-500' },
            { title: 'Documents', desc: 'Presentations & data-room', href: '/ir/documents', icon: FolderArchive, color: 'text-violet-500' },
            { title: 'Shareholders', desc: 'Ownership register + CSV import', href: '/ir/shareholders', icon: Users2, color: 'text-cyan-500' },
            { title: 'Performance', desc: 'NAV history & IRR metrics', href: '/ir/performance', icon: LineChart, color: 'text-indigo-500' },
            { title: 'Stock & Market', desc: 'Share price & market data', href: '/ir/market', icon: CandlestickChart, color: 'text-emerald-500' },
            { title: 'Analytics', desc: 'Content activity & downloads', href: '/ir/analytics', icon: BarChart3, color: 'text-sky-500' },
            { title: 'Newsroom', desc: 'Press releases & news (CMS)', href: NEWSROOM_HREF, icon: Newspaper, color: 'text-orange-500' },
          ].map((m) => (
            <Link key={m.title} href={m.href}>
              <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <m.icon className={`mt-0.5 h-5 w-5 shrink-0 ${m.color}`} />
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{m.title}</CardTitle>
                      <CardDescription className="mt-0.5 text-xs">{m.desc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
