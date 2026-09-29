// Pure, real-data-only aggregation for the News Desk command center. Every
// number here is derived from actual ContentItem fields — nothing here may be
// a placeholder/mock value. Callers wrap this in useMemo with the fetched list.

import { NEWS_TOPICS, NEWS_REGIONS } from '@/lib/constants/news-taxonomy';
import type { ContentItem } from '@/lib/types/cms-content.types';

const DAY_MS = 86_400_000;
const dayKey = (iso: string) => iso.slice(0, 10);

export interface KpiStat {
  label: string;
  value: number;
  /** null when there's no prior-period data to compare against (not "0% change"). */
  trendPct: number | null;
  sparkline: number[];
  color: string;
}

export interface PipelineStage {
  key: string;
  label: string;
  statuses: ContentItem['status'][];
  count: number;
  color: string;
  /** Average hours between createdAt and updatedAt for items currently in this
   * stage — a real, if approximate, proxy for "time waiting" since the backend
   * doesn't emit per-transition timestamps to the client. */
  avgWaitHours: number | null;
}

export interface DayBucket {
  date: string;
  uploaded: number;
  published: number;
  draft: number;
  scheduled: number;
}

export interface NewsroomStats {
  kpis: {
    published: KpiStat;
    uploaded: KpiStat;
    drafts: KpiStat;
    scheduled: KpiStat;
    breaking: KpiStat;
    pendingReview: KpiStat;
    staleDrafts: KpiStat;
    avgPublishMinutes: number | null;
  };
  pipeline: PipelineStage[];
  trend7: DayBucket[];
  byTopic: [string, number][];
  byRegion: [string, number][];
  breakingItems: ContentItem[];
  sourceBreakdown: [string, number][];
}

function dailySeries(items: ContentItem[], dateField: (i: ContentItem) => string | null | undefined, days: number): number[] {
  const buckets = new Map<string, number>();
  for (let d = days - 1; d >= 0; d--) {
    buckets.set(dayKey(new Date(Date.now() - d * DAY_MS).toISOString()), 0);
  }
  items.forEach((i) => {
    const raw = dateField(i);
    if (!raw) return;
    const key = dayKey(raw);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  });
  return Array.from(buckets.values());
}

function trendPct(series: number[]): number | null {
  if (series.length < 2) return null;
  const latest = series[series.length - 1];
  const prior = series[series.length - 2];
  if (prior === 0) return latest > 0 ? 100 : null;
  return Math.round(((latest - prior) / prior) * 100);
}

function kpi(label: string, items: ContentItem[], dateField: (i: ContentItem) => string | null | undefined, color: string): KpiStat {
  const series = dailySeries(items, dateField, 7);
  return { label, value: series[series.length - 1], trendPct: trendPct(series), sparkline: series, color };
}

export function computeNewsroomStats(
  items: ContentItem[],
  topicLabelById: Map<string, string>,
  regionLabelById: Map<string, string>,
): NewsroomStats {
  const now = Date.now();

  const publishedItems = items.filter((i) => i.publishedAt);
  const draftItems = items.filter((i) => i.status === 'draft');
  const scheduledItems = items.filter((i) => i.status === 'scheduled');
  const breakingItems = items.filter((i) => i.isBreaking);
  const pendingItems = items.filter((i) => i.status === 'pending_review');
  const staleDraftItems = draftItems.filter((i) => now - Date.parse(i.createdAt) > DAY_MS);

  const publishDurations = publishedItems
    .map((i) => (i.publishedAt ? Date.parse(i.publishedAt) - Date.parse(i.createdAt) : NaN))
    .filter((ms) => Number.isFinite(ms) && ms >= 0);
  const avgPublishMinutes = publishDurations.length
    ? Math.round(publishDurations.reduce((a, b) => a + b, 0) / publishDurations.length / 60_000)
    : null;

  const kpis: NewsroomStats['kpis'] = {
    // Pass the FULL item set (not pre-filtered to today) so dailySeries can bucket
    // real counts across all 7 days — today's value still lands in the last bucket.
    published: kpi('Published Today', items, (i) => i.publishedAt, '#16C784'),
    uploaded: kpi('Uploaded Today', items, (i) => i.createdAt, '#2D7FF9'),
    drafts: { label: 'Drafts', value: draftItems.length, trendPct: null, sparkline: dailySeries(draftItems, (i) => i.createdAt, 7), color: '#F59E0B' },
    scheduled: { label: 'Scheduled', value: scheduledItems.length, trendPct: null, sparkline: dailySeries(scheduledItems, (i) => i.scheduledAt, 7), color: '#2D7FF9' },
    breaking: { label: 'Breaking News', value: breakingItems.length, trendPct: null, sparkline: dailySeries(breakingItems, (i) => i.createdAt, 7), color: '#EF4444' },
    pendingReview: { label: 'Pending Review', value: pendingItems.length, trendPct: null, sparkline: dailySeries(pendingItems, (i) => i.createdAt, 7), color: '#9CA3AF' },
    staleDrafts: { label: 'Stale Drafts (>24h)', value: staleDraftItems.length, trendPct: null, sparkline: dailySeries(staleDraftItems, (i) => i.createdAt, 7), color: '#EF4444' },
    avgPublishMinutes,
  };

  // ── Editorial pipeline — real workflow states, not a fictional AI-writing stage ──
  const stageOf = (statuses: ContentItem['status'][], color: string, key: string, label: string): PipelineStage => {
    const inStage = items.filter((i) => statuses.includes(i.status));
    const waits = inStage
      .map((i) => Date.parse(i.updatedAt) - Date.parse(i.createdAt))
      .filter((ms) => Number.isFinite(ms) && ms >= 0);
    return {
      key, label, statuses, count: inStage.length, color,
      avgWaitHours: waits.length ? Math.round((waits.reduce((a, b) => a + b, 0) / waits.length / 3_600_000) * 10) / 10 : null,
    };
  };
  const pipeline: PipelineStage[] = [
    stageOf(['draft', 'changes_requested'], '#9CA3AF', 'draft', 'Draft'),
    stageOf(['pending_review', 'compliance_review'], '#F59E0B', 'review', 'Editor Review'),
    stageOf(['approved', 'scheduled'], '#2D7FF9', 'scheduled', 'Scheduled'),
    stageOf(['published'], '#16C784', 'published', 'Published'),
  ];

  // ── 7-day stacked trend ──
  const trend7: DayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const key = dayKey(new Date(now - (6 - i) * DAY_MS).toISOString());
    return { date: key, uploaded: 0, published: 0, draft: 0, scheduled: 0 };
  });
  const bucketByKey = new Map(trend7.map((b) => [b.date, b]));
  items.forEach((i) => {
    const created = bucketByKey.get(dayKey(i.createdAt));
    if (created) created.uploaded += 1;
    if (i.publishedAt) {
      const pub = bucketByKey.get(dayKey(i.publishedAt));
      if (pub) pub.published += 1;
    }
    if (i.status === 'draft') {
      const d = bucketByKey.get(dayKey(i.createdAt));
      if (d) d.draft += 1;
    }
    if (i.status === 'scheduled' && i.scheduledAt) {
      const s = bucketByKey.get(dayKey(i.scheduledAt));
      if (s) s.scheduled += 1;
    }
  });

  // ── Coverage — full fixed taxonomy, zeros included ──
  const byTopicMap = new Map<string, number>(NEWS_TOPICS.map((t) => [t, 0]));
  const byRegionMap = new Map<string, number>(NEWS_REGIONS.map((r) => [r.label, 0]));
  items.forEach((i) => {
    i.categoryIds.forEach((id) => {
      const topic = topicLabelById.get(id);
      if (topic) byTopicMap.set(topic, (byTopicMap.get(topic) ?? 0) + 1);
      const region = regionLabelById.get(id);
      if (region) byRegionMap.set(region, (byRegionMap.get(region) ?? 0) + 1);
    });
  });

  // ── Breaking news source breakdown — real externalSourceName, "Newsroom" for
  //    internally-authored breaking stories with no external wire source ──
  const sourceCounts = new Map<string, number>();
  breakingItems.forEach((i) => {
    const source = i.externalSourceName?.trim() || 'Imperialpedia Newsroom';
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  });

  return {
    kpis,
    pipeline,
    trend7,
    byTopic: Array.from(byTopicMap.entries()).sort((a, b) => b[1] - a[1]),
    byRegion: Array.from(byRegionMap.entries()).sort((a, b) => b[1] - a[1]),
    breakingItems: breakingItems.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    sourceBreakdown: Array.from(sourceCounts.entries()).sort((a, b) => b[1] - a[1]),
  };
}
