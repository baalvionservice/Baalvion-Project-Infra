'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { useUIStore } from '@/lib/store/uiStore';
import { serviceClients } from '@/lib/api/client';
import { NICHES, claimedCategories, type NicheDef } from '@/lib/constants/news-niches';
import type { NewsStatsOverview, NewsSource } from '@/lib/types/news.types';
import './desks.css';

const nf = new Intl.NumberFormat('en-US');

export default function NewsIntelligenceDeskPicker() {
  const { setBreadcrumbs } = useUIStore();
  useEffect(() => { setBreadcrumbs([{ label: 'News Intelligence' }]); }, [setBreadcrumbs]);

  const { data: stats } = useQuery({
    queryKey: ['news', 'stats-overview'],
    queryFn: () => serviceClients.news.get('/stats/overview').then((r) => r.data.data as NewsStatsOverview),
    refetchInterval: 60_000,
  });

  // Sources carry their beat as default_category, which is the only way to say
  // how many feeds a desk actually has — the overview counts them globally.
  const { data: sources } = useQuery({
    queryKey: ['news', 'sources'],
    queryFn: () => serviceClients.news.get('/sources').then((r) => r.data.data as NewsSource[]),
  });

  const byCategory = new Map((stats?.byCategory ?? []).map((c) => [c.category, c.count]));

  const forNiche = (niche: NicheDef) => {
    const articles = niche.wireCategories.reduce((sum, c) => sum + (byCategory.get(c) ?? 0), 0);
    const feeds = (sources ?? []).filter((s) => niche.wireCategories.includes(s.default_category));
    return {
      articles,
      feeds: feeds.length,
      activeFeeds: feeds.filter((s) => s.is_active).length,
    };
  };

  // Everything being ingested that no desk publishes. Shown rather than hidden:
  // it is real ingestion cost against beats nothing covers.
  const unclaimed = (stats?.byCategory ?? [])
    .filter((c) => !claimedCategories.has(c.category))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bv-desks">
      <header className="bv-desks__masthead">
        <span className="bv-desks__wordmark">News <span>Intelligence</span></span>
        <span className="bv-desks__sub">Choose a desk</span>
        <span className="bv-desks__feed">
          {stats ? `${nf.format(stats.totalArticles)} ingested · ${stats.articlesLast24h} in 24h` : 'loading feed'}
        </span>
      </header>

      <div className="bv-desks__grid">
        {NICHES.map((niche) => {
          const s = forNiche(niche);
          return (
            <Link key={niche.id} href={`/news-intelligence/${niche.id}`} className="bv-desk">
              <span className="bv-desk__k">Desk</span>
              <p className="bv-desk__name">{niche.label}</p>
              <p className="bv-desk__site">{niche.site}</p>
              <p className="bv-desk__blurb">{niche.blurb}</p>

              <div className="bv-desk__stats">
                <div className="bv-desk__stat">
                  <span className="bv-desk__stat-k">Articles</span>
                  <span className="bv-desk__stat-v">{stats ? nf.format(s.articles) : '—'}</span>
                </div>
                <div className="bv-desk__stat">
                  <span className="bv-desk__stat-k">Feeds</span>
                  <span className="bv-desk__stat-v">{sources ? `${s.activeFeeds}/${s.feeds}` : '—'}</span>
                </div>
                <div className="bv-desk__stat">
                  <span className="bv-desk__stat-k">Beats</span>
                  <span className="bv-desk__stat-v">{niche.wireCategories.length}</span>
                </div>
              </div>

              <div className="bv-desk__cats">
                {niche.wireCategories.map((c) => (
                  <span key={c} className="bv-desk__cat">{c}</span>
                ))}
              </div>

              <span className="bv-desk__go">
                Open overview <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          );
        })}
      </div>

      {unclaimed.length > 0 && (
        <div className="bv-desks__spare">
          <span className="bv-desks__spare-k">Ingested, not published</span>
          <p className="bv-desks__spare-note">
            These beats are being pulled and stored, but no desk covers them — nothing on the estate
            publishes from them today. Either give a site an editorial charter that claims the beat,
            or switch the feeds off to stop paying to store them.
          </p>
          <div className="bv-desks__spare-list">
            {unclaimed.map((c) => (
              <span key={c.category} className="bv-desks__spare-item">
                {c.category} · {nf.format(c.count)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
