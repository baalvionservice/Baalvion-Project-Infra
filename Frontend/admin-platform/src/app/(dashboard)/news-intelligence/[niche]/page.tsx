'use client';

import { use, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { nicheById } from '@/lib/constants/news-niches';
import type { NewsStatsOverview, NewsSource, NewsTrendingItem } from '@/lib/types/news.types';
import '../desks.css';

const nf = new Intl.NumberFormat('en-US');

/** Sub-pages, each carrying the desk's beat so the list lands pre-filtered. */
const TOOLS = [
  { href: 'sources', label: 'Sources' },
  { href: 'articles', label: 'Articles' },
  { href: 'ai', label: 'AI enrichment' },
  { href: 'images', label: 'Images' },
  { href: 'seo', label: 'SEO' },
  { href: 'trending', label: 'Trending' },
];

export default function NicheOverviewPage({ params }: { params: Promise<{ niche: string }> }) {
  const { niche: nicheId } = use(params);
  const niche = nicheById(nicheId);
  const { setBreadcrumbs } = useUIStore();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'News Intelligence', href: '/news-intelligence' },
      { label: niche ? `${niche.label} desk` : 'Unknown desk' },
    ]);
  }, [setBreadcrumbs, niche]);

  const { data: stats } = useQuery({
    queryKey: ['news', 'stats-overview'],
    queryFn: () => serviceClients.news.get('/stats/overview').then((r) => r.data.data as NewsStatsOverview),
    refetchInterval: 60_000,
    enabled: Boolean(niche),
  });

  const { data: sources } = useQuery({
    queryKey: ['news', 'sources'],
    queryFn: () => serviceClients.news.get('/sources').then((r) => r.data.data as NewsSource[]),
    enabled: Boolean(niche),
  });

  const { data: trending } = useQuery({
    queryKey: ['news', 'trending', 'category'],
    queryFn: () =>
      serviceClients.news
        .get('/news/trending', { params: { dimension: 'category' } })
        .then((r) => r.data.data.items as NewsTrendingItem[]),
    enabled: Boolean(niche),
  });

  if (!niche) {
    return (
      <div className="bv-desks">
        <header className="bv-desks__masthead">
          <span className="bv-desks__wordmark">News <span>Intelligence</span></span>
          <span className="bv-desks__sub">Unknown desk</span>
        </header>
        <div className="bv-desks__empty">
          No desk called “{nicheId}”. <Link href="/news-intelligence" className="bv-desks__back">Back to desks</Link>
        </div>
      </div>
    );
  }

  const byCategory = new Map((stats?.byCategory ?? []).map((c) => [c.category, c.count]));
  const articles = niche.wireCategories.reduce((sum, c) => sum + (byCategory.get(c) ?? 0), 0);
  const feeds = (sources ?? []).filter((s) => niche.wireCategories.includes(s.default_category));
  const activeFeeds = feeds.filter((s) => s.is_active);

  // A trending row with no dimension value cannot belong to a beat.
  const deskTrending = (trending ?? []).filter((t) => t.value != null && niche.wireCategories.includes(t.value));
  const peak = Math.max(1, ...deskTrending.map((t) => t.count));

  // Share of everything ingested that this desk can actually use.
  const totalIngested = stats?.totalArticles ?? 0;
  const sharePct = totalIngested ? Math.round((articles / totalIngested) * 100) : 0;

  return (
    <div className="bv-desks">
      <header className="bv-desks__masthead">
        <span className="bv-desks__wordmark">{niche.label} <span>Desk</span></span>
        <span className="bv-desks__sub">{niche.site}</span>
        <span className="bv-desks__feed">
          <Link href="/news-intelligence" className="bv-desks__back">
            <ArrowLeft className="inline h-3 w-3" /> All desks
          </Link>
        </span>
      </header>

      <div className="bv-desks__rail">
        <div className="bv-desks__tile">
          <span className="bv-desks__tile-k">Articles on beat</span>
          <span className="bv-desks__tile-v">{stats ? nf.format(articles) : '—'}</span>
          <span className="bv-desks__tile-n">{sharePct}% of everything ingested</span>
        </div>
        <div className="bv-desks__tile">
          <span className="bv-desks__tile-k">Feeds</span>
          <span className="bv-desks__tile-v">{sources ? `${activeFeeds.length}/${feeds.length}` : '—'}</span>
          <span className="bv-desks__tile-n">active / registered</span>
        </div>
        <div className="bv-desks__tile">
          <span className="bv-desks__tile-k">Beats</span>
          <span className="bv-desks__tile-v">{niche.wireCategories.length}</span>
          <span className="bv-desks__tile-n">{niche.wireCategories.join(' · ')}</span>
        </div>
        <div className="bv-desks__tile">
          <span className="bv-desks__tile-k">Last ingestion</span>
          <span className="bv-desks__tile-v" style={{ fontSize: 15 }}>
            {stats?.lastIngestedAt ? new Date(stats.lastIngestedAt).toLocaleTimeString() : '—'}
          </span>
          <span className="bv-desks__tile-n">
            {stats?.lastIngestedAt ? new Date(stats.lastIngestedAt).toLocaleDateString() : 'never'}
          </span>
        </div>
      </div>

      <section className="bv-desks__panel">
        <div className="bv-desks__panel-head">Volume by beat · 24h against the prior 24h</div>
        {deskTrending.length === 0 ? (
          // Not the same as "no articles": the trend window is the last 24h of
          // PUBLISH dates, and a desk fed by government releases routinely has a
          // full archive and a quiet day. Say which, or it reads as broken.
          <div className="bv-desks__empty">
            {articles > 0
              ? `Nothing published on this beat in the last 24h — ${nf.format(articles)} articles on file`
              : 'No articles on this beat yet'}
          </div>
        ) : (
          deskTrending.map((t) => (
            <div key={t.value} className="bv-desks__row">
              <span style={{ flex: 1 }}>
                {t.value}
                <span className="bv-desks__bar" style={{ width: `${(t.count / peak) * 100}%` }} />
              </span>
              <span className="bv-desks__num">
                {nf.format(t.count)}
                {t.changePct !== null && (
                  <span style={{ marginLeft: 10, color: t.changePct >= 0 ? 'var(--nr-green-soft)' : 'var(--nr-red-soft)' }}>
                    {t.changePct >= 0 ? '+' : ''}{t.changePct}%
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="bv-desks__panel">
        <div className="bv-desks__panel-head">Feeds on this beat</div>
        {feeds.length === 0 ? (
          <div className="bv-desks__empty">No sources registered for this beat</div>
        ) : (
          feeds.map((s) => (
            <div key={s.id} className="bv-desks__row">
              <span style={{ flex: 1 }}>{s.name}</span>
              <span className="bv-desks__num">
                {s.type} · {s.default_category}
                <span style={{ marginLeft: 10, color: s.is_active ? 'var(--nr-green-soft)' : 'var(--nr-red-soft)' }}>
                  {s.is_active ? 'LIVE' : 'OFF'}
                </span>
              </span>
            </div>
          ))
        )}
      </section>

      <div className="bv-desks__links">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={`/news-intelligence/${t.href}?category=${encodeURIComponent(niche.wireCategories[0])}`}
            className="bv-desks__link"
          >
            {t.label}
          </Link>
        ))}
        <Link href={`/newsroom/${niche.siteSlug}`} className="bv-desks__link bv-desks__link--go">
          Newsroom →
        </Link>
      </div>
    </div>
  );
}
