'use client';

import { LayoutDashboard } from 'lucide-react';
import type { Website } from '@/lib/types/cms-website.types';
import { useDashboardData } from './dashboard-data';
import MetricGrid from './MetricGrid';
import RecentActivity from './RecentActivity';
import PublishingAnalytics from './PublishingAnalytics';
import TopContributors from './TopContributors';
import SeoOverview from './SeoOverview';
import WebsiteHealth from './WebsiteHealth';
import QuickActions from './QuickActions';

interface Props {
  /** Route segment (slug or UUID) — used to build links. */
  websiteId: string;
  /** Resolved canonical UUID — used for stats/data queries. */
  canonicalId: string;
  website: Website | undefined;
}

export default function WebsiteDashboard({ websiteId, canonicalId, website }: Props) {
  const data = useDashboardData({ canonicalId, website });

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <LayoutDashboard className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">Dashboard overview</h2>
      </div>

      {/* Metric cards */}
      <MetricGrid metrics={data.metrics} loading={data.isLoading} />

      {/* Row 1 — Publishing analytics (wide) + Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PublishingAnalytics data={data.publishing} />
        </div>
        <QuickActions websiteId={websiteId} />
      </div>

      {/* Row 2 — Activity feed + Top contributors + Website health */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RecentActivity events={data.activity} />
        <TopContributors contributors={data.contributors} />
        <WebsiteHealth data={data.health} />
      </div>

      {/* Row 3 — SEO overview */}
      <SeoOverview data={data.seo} seoHref={`/cms/websites/${websiteId}/seo`} />
    </section>
  );
}
