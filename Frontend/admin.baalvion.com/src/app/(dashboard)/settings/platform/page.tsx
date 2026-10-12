'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Globe, ExternalLink, Flag, ScrollText, Activity, Store, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useWebsites } from '@/lib/queries/cms-websites.queries';
import { useUIStore } from '@/lib/store/uiStore';

// Where each platform-wide concern is configured. Real routes only.
const AREAS = [
  { title: 'Websites and content', text: 'Create sites, manage who works on them, publish.', href: '/cms/websites', icon: Globe },
  { title: 'Shop settings', text: 'Stores, currencies, tax and markets for the online shop.', href: '/commerce/settings', icon: Store },
  { title: 'Feature flags', text: 'Switch platform features on and off safely.', href: '/feature-flags', icon: Flag },
  { title: 'Audit log', text: 'Who changed what, and when.', href: '/audit-logs', icon: ScrollText },
  { title: 'System status', text: 'Health of every service behind the platform.', href: '/status', icon: Activity },
];

export default function PlatformSettingsPage() {
  const setBreadcrumbs = useUIStore((s) => s.setBreadcrumbs);
  useEffect(() => { setBreadcrumbs([{ label: 'Settings', href: '/settings' }, { label: 'Platform' }]); }, [setBreadcrumbs]);
  const { data, isLoading } = useWebsites({ limit: 100 });
  const sites = data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Platform" description="The websites this console manages, and where each platform-wide setting lives." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">Managed websites <Badge variant="secondary">{sites.length}</Badge></CardTitle>
          <CardDescription className="text-xs">Live from the platform. Open a site to manage its team, content and SEO.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : sites.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No websites are visible to your account.</p>
          ) : sites.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <Link href={`/cms/websites/${w.slug}`} className="truncate text-sm font-medium hover:underline">{w.name}</Link>
                <p className="truncate text-xs text-muted-foreground">{w.domain}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={w.status} />
                <a href={`https://${w.domain}`} target="_blank" rel="noopener noreferrer" aria-label={`Open ${w.name}`} className="text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></a>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AREAS.map((a) => (
          <Link key={a.title} href={a.href} className="group">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <a.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-1 text-sm">{a.title}<ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" /></CardTitle>
                    <CardDescription className="mt-0.5 text-xs">{a.text}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
