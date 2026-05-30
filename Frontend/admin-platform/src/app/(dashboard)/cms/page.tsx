'use client';

import { useEffect } from 'react';
import { Globe, FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsites } from '@/lib/queries/cms-websites.queries';
import { useMyPendingApprovals } from '@/lib/queries/cms-workflow.queries';
import { useUIStore } from '@/lib/store/uiStore';
import { formatDate } from '@/lib/utils/format';
import type { Website } from '@/lib/types/cms-website.types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-600',
  maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  archived: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
};

export default function CmsDashboardPage() {
  const { setBreadcrumbs } = useUIStore();
  const { data: websitesData, isLoading: loadingWebsites } = useWebsites({ limit: 50 });
  const { data: pendingApprovals, isLoading: loadingApprovals } = useMyPendingApprovals();

  useEffect(() => {
    setBreadcrumbs([{ label: 'CMS' }]);
  }, [setBreadcrumbs]);

  const websites = websitesData?.data ?? [];
  const totalContent = websites.reduce((s, w) => s + w.contentCount, 0);
  const activeWebsites = websites.filter((w) => w.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="CMS Overview"
        description="Manage all your websites and content from one place"
        actions={
          <Button size="sm" asChild>
            <Link href="/cms/websites">
              <Globe className="mr-2 h-4 w-4" />
              All Websites
            </Link>
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            icon: Globe,
            label: 'Active Websites',
            value: loadingWebsites ? null : activeWebsites,
            sub: `of ${websites.length} total`,
          },
          {
            icon: FileText,
            label: 'Total Content',
            value: loadingWebsites ? null : totalContent,
            sub: 'across all sites',
          },
          {
            icon: Clock,
            label: 'Pending Review',
            value: loadingApprovals ? null : (pendingApprovals?.length ?? 0),
            sub: 'awaiting approval',
            highlight: (pendingApprovals?.length ?? 0) > 0,
          },
          {
            icon: TrendingUp,
            label: 'Websites',
            value: loadingWebsites ? null : (websitesData?.pagination.total ?? 0),
            sub: 'managed sites',
          },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  {kpi.value === null ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className={`text-2xl font-bold mt-1 ${kpi.highlight ? 'text-destructive' : ''}`}>
                      {kpi.value}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</p>
                </div>
                <kpi.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Websites */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Recent Websites</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                <Link href="/cms/websites">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {loadingWebsites ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : websites.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No websites yet</p>
                  <Button size="sm" asChild>
                    <Link href="/cms/websites">Create Website</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {websites.map((w: Website) => (
                    <Link
                      key={w.id}
                      href={`/cms/websites/${w.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{w.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{w.domain}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{w.contentCount} items</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[w.status] ?? ''}`}
                        >
                          {w.status}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending approvals */}
        <div>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              {(pendingApprovals?.length ?? 0) > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingApprovals!.length}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {loadingApprovals ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : !pendingApprovals?.length ? (
                <div className="py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">All caught up!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingApprovals.map((req) => (
                    <Link
                      key={req.id}
                      href={`/cms/websites/${req.websiteId}/content/${req.contentId}`}
                      className="block px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{req.contentTitle}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.websiteName}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        By {req.requestedBy.fullName} · {formatDate(req.requestedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
