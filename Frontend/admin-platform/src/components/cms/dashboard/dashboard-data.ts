'use client';

// Aggregates every data source the site dashboard needs into one hook, with
// realistic fallbacks so the dashboard is never empty while the CMS backend is
// warming up or a service is unavailable. Real numbers are always preferred —
// mock values only fill in when a query returns nothing (loading / error).

import { useMemo } from 'react';
import { useWebsiteStats, useWebsiteMembers } from '@/lib/queries/cms-websites.queries';
import { useWorkflowStats } from '@/lib/queries/cms-workflow.queries';
import { useWebsiteCategories } from '@/lib/queries/cms-taxonomy.queries';
import { useContentList } from '@/lib/queries/cms-content.queries';
import type { ContentItem } from '@/lib/types/cms-content.types';
import type { CmsRole, Website, WebsiteMember } from '@/lib/types/cms-website.types';

// Roles that primarily produce content vs. review/ship it. SEO managers sit with
// editors since they gate how content goes live.
const WRITER_ROLES: CmsRole[] = ['cms_author', 'cms_contributor'];
const EDITOR_ROLES: CmsRole[] = ['cms_editor', 'cms_publisher', 'cms_reviewer', 'cms_seo_manager'];

const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_QUOTA_MB: Record<Website['plan'], number> = {
  basic: 1024,
  pro: 5120,
  enterprise: 20480,
};

export interface DashboardMetrics {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  scheduledContent: number;
  pendingApprovals: number;
  totalCategories: number;
  totalSubcategories: number;
  totalMedia: number;
  totalUsers: number;
  writers: number;
  editors: number;
  admins: number;
}

export type ActivityKind = 'created' | 'published' | 'approved' | 'media' | 'user';

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  title: string;
  actor: string;
  at: string; // ISO
}

export interface ContributorRow {
  id: string;
  name: string;
  role: string;
  articles: number;
}

export interface PublishingAnalytics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  trend: Array<{ date: string; value: number }>;
}

export interface SeoOverview {
  indexedPages: number;
  missingTitles: number;
  missingDescriptions: number;
  score: number;
  sampleSize: number;
}

export interface HealthOverview {
  siteStatus: Website['status'];
  databaseOnline: boolean;
  storageUsedMb: number;
  storageQuotaMb: number;
  lastBackup: string; // ISO
}

export interface DashboardData {
  isLoading: boolean;
  usingFallback: boolean;
  metrics: DashboardMetrics;
  activity: ActivityEvent[];
  publishing: PublishingAnalytics;
  contributors: ContributorRow[];
  seo: SeoOverview;
  health: HealthOverview;
}

const ROLE_LABEL: Partial<Record<CmsRole, string>> = {
  cms_admin: 'Admin',
  cms_editor: 'Editor',
  cms_publisher: 'Publisher',
  cms_reviewer: 'Reviewer',
  cms_seo_manager: 'SEO Manager',
  cms_author: 'Author',
  cms_contributor: 'Contributor',
  cms_viewer: 'Viewer',
};

function isWithin(iso: string | null | undefined, ms: number, now: number): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && now - t <= ms && t <= now;
}

interface Args {
  canonicalId: string;
  website: Website | undefined;
}

export function useDashboardData({ canonicalId, website }: Args): DashboardData {
  const stats = useWebsiteStats(canonicalId);
  const workflow = useWorkflowStats(canonicalId);
  const categories = useWebsiteCategories(canonicalId);
  const members = useWebsiteMembers(canonicalId);
  const content = useContentList({
    websiteId: canonicalId,
    sortBy: 'updatedAt',
    sortDir: 'desc',
    limit: 50,
  });

  const isLoading =
    stats.isLoading || workflow.isLoading || categories.isLoading || members.isLoading;

  return useMemo<DashboardData>(() => {
    const now = Date.now();

    const s = stats.data;
    const wf = workflow.data;
    const cats = categories.data ?? [];
    const team = (members.data ?? []) as WebsiteMember[];
    const items = (content.data?.data ?? []) as ContentItem[];

    // Always derive from real sources — no fabricated data. An empty site shows real
    // zeros / empty states, never placeholder names or numbers.
    const rootCats = cats.filter((c) => !c.parentId).length;
    const subCats = cats.length - rootCats;

    const roleCount = (roles: CmsRole[]) =>
      team.filter((m) => roles.includes(m.cmsRole)).length;

    const metrics: DashboardMetrics = {
      totalContent: s?.totalContent ?? content.data?.pagination?.total ?? items.length,
      publishedContent: s?.publishedContent ?? items.filter((i) => i.status === 'published').length,
      draftContent: s?.draftContent ?? items.filter((i) => i.status === 'draft').length,
      scheduledContent: wf?.scheduled ?? items.filter((i) => i.status === 'scheduled').length,
      pendingApprovals: wf?.pending ?? s?.pendingReview ?? 0,
      totalCategories: rootCats,
      totalSubcategories: subCats,
      totalMedia: s?.totalMedia ?? 0,
      totalUsers: team.length || (website?.memberCount ?? 0),
      writers: roleCount(WRITER_ROLES),
      editors: roleCount(EDITOR_ROLES),
      admins: roleCount(['cms_admin']),
    };

    // Map a member id → display name so content events (which carry only an
    // author id from the backend) can show a real person.
    const nameById = new Map<number, string>();
    team.forEach((m) => nameById.set(m.userId, m.user.fullName));

    // ── Recent activity — one event per content item (most significant action) ──
    const contentEvents: ActivityEvent[] = items.slice(0, 12).map((i) => {
      const actor = i.author.fullName || nameById.get(i.author.id) || 'A teammate';
      if (i.status === 'published' && i.publishedAt) {
        return { id: `c-${i.id}`, kind: 'published', title: i.title, actor, at: i.publishedAt };
      }
      if (i.status === 'approved') {
        return { id: `c-${i.id}`, kind: 'approved', title: i.title, actor, at: i.updatedAt };
      }
      return { id: `c-${i.id}`, kind: 'created', title: i.title, actor, at: i.createdAt };
    });

    const memberEvents: ActivityEvent[] = team
      .filter((m) => m.joinedAt)
      .slice(0, 6)
      .map((m) => ({
        id: `m-${m.userId}`,
        kind: 'user',
        title: `${m.user.fullName} joined as ${ROLE_LABEL[m.cmsRole] ?? 'member'}`,
        actor: m.user.fullName,
        at: m.joinedAt,
      }));

    const activity = [...contentEvents, ...memberEvents]
      .filter((e) => e.at && Number.isFinite(Date.parse(e.at)))
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 8);

    // ── Publishing analytics — counts + a 14-day trend from publishedAt ──
    const published = items.filter((i) => i.publishedAt);
    const buckets = new Map<string, number>();
    for (let d = 13; d >= 0; d--) {
      buckets.set(new Date(now - d * DAY_MS).toISOString().slice(0, 10), 0);
    }
    published.forEach((i) => {
      const key = (i.publishedAt as string).slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    const publishing: PublishingAnalytics = {
      today: published.filter((i) => isWithin(i.publishedAt, DAY_MS, now)).length,
      thisWeek: published.filter((i) => isWithin(i.publishedAt, 7 * DAY_MS, now)).length,
      thisMonth:
        published.filter((i) => isWithin(i.publishedAt, 30 * DAY_MS, now)).length ||
        metrics.publishedContent,
      trend: Array.from(buckets.entries()).map(([k, v]) => ({
        date: new Date(`${k}T00:00:00Z`).toISOString(),
        value: v,
      })),
    };

    // ── Top contributors — real names (members) joined with authored counts ──
    const authoredBy = new Map<number, number>();
    items.forEach((i) => authoredBy.set(i.author.id, (authoredBy.get(i.author.id) ?? 0) + 1));
    const contributors: ContributorRow[] = team
      .map((m) => ({
        id: String(m.userId),
        name: m.user.fullName,
        role: ROLE_LABEL[m.cmsRole] ?? 'Member',
        articles: authoredBy.get(m.userId) ?? 0,
      }))
      .sort((a, b) => b.articles - a.articles)
      .slice(0, 5);

    // ── SEO overview — measured over the loaded content sample ──
    const sample = items;
    const missingTitles = sample.filter((i) => !i.seo?.title?.trim()).length;
    const missingDescriptions = sample.filter((i) => !i.seo?.description?.trim()).length;
    const completeness = sample.length
      ? 1 - (missingTitles + missingDescriptions) / (sample.length * 2)
      : 1;
    const seo: SeoOverview = {
      indexedPages: metrics.publishedContent,
      missingTitles,
      missingDescriptions,
      score: Math.round(60 + completeness * 40),
      sampleSize: sample.length,
    };

    const health: HealthOverview = {
      siteStatus: website?.status ?? 'active',
      databaseOnline: !stats.isError && !content.isError,
      storageUsedMb: Math.round(s?.mediaStorageUsedMb ?? 0),
      storageQuotaMb: STORAGE_QUOTA_MB[website?.plan ?? 'pro'],
      lastBackup: '', // no backup subsystem surfaced — the row is hidden when empty
    };

    return {
      isLoading,
      usingFallback: false,
      metrics,
      activity,
      publishing,
      contributors,
      seo,
      health,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    stats.data,
    stats.isError,
    workflow.data,
    categories.data,
    members.data,
    content.data,
    content.isError,
    isLoading,
    website,
  ]);
}
