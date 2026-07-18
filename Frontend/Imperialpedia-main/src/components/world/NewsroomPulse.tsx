"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { newsArticleHref } from "@/lib/data/article-url";

/**
 * Live, auto-refreshing "newsroom pulse" strip for the /world homepage — a
 * public-safe version of the admin News Desk command center. Shows real
 * published-article coverage (topic + region) and a live feed, all fetched
 * client-side from the free/keyless public CMS delivery API (no paid service,
 * no server cost beyond what /world already uses). Deliberately excludes
 * anything from the internal admin dashboard (drafts, pending review, author
 * workload, stale-draft counts) — that's newsroom-internal, not for readers.
 */

const CMS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://api.baalvion.com/api/v1/public"
    : "http://localhost:3018/api/v1/public");
const SITE_SLUG = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || "imperialpedia";
const REFRESH_MS = 15_000;

const TOPICS = [
  "Markets", "Business", "Investing", "Tech", "Politics", "World",
  "Finance", "Health & Science", "Media", "Real Estate", "Energy",
  "Climate", "Personal Finance",
];

const REGIONS = [
  { label: "World", slug: "world" },
  { label: "U.S.", slug: "us" },
  { label: "Europe", slug: "europe" },
  { label: "Asia-Pacific", slug: "asia" },
  { label: "China", slug: "china" },
  { label: "Emerging Markets", slug: "emerging" },
];

interface PulseItem {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | null;
  isBreaking?: boolean;
  categoryIds?: string[];
  category?: { id: string; name: string; slug: string } | null;
  contentType?: string;
}

function matchTopic(name: string | undefined): string | null {
  if (!name) return null;
  const n = name.toLowerCase();
  return TOPICS.find((t) => n.includes(t.toLowerCase()) || t.toLowerCase().includes(n)) ?? null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function NewsroomPulse() {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [regionIdByLabel, setRegionIdByLabel] = useState<Map<string, string>>(new Map());
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // Resolve the 6 region category ids once — real lookups against the public
  // category endpoint, not guessed. A region that has no category yet (nobody
  // has tagged a story with it) simply won't show up in the coverage map beyond
  // its real zero count.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        REGIONS.map(async (r) => {
          const env = await fetchJson<{ data?: { id: string } }>(
            `${CMS_PUBLIC_URL}/${SITE_SLUG}/categories/${r.slug}`,
          );
          return env?.data?.id ? ([env.data.id, r.label] as const) : null;
        }),
      );
      if (cancelled) return;
      setRegionIdByLabel(new Map(pairs.filter((p): p is readonly [string, string] => !!p)));
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const env = await fetchJson<{ data?: PulseItem[] }>(
        `${CMS_PUBLIC_URL}/${SITE_SLUG}/content?contentType=news&limit=100`,
      );
      if (cancelled) return;
      if (env?.data) setItems(env.data);
      setLastFetched(Date.now());
      setLoaded(true);
    };
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (lastFetched) setSecondsAgo(Math.round((Date.now() - lastFetched) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastFetched]);

  const stats = useMemo(() => {
    const byTopic = new Map<string, number>(TOPICS.map((t) => [t, 0]));
    const byRegion = new Map<string, number>(REGIONS.map((r) => [r.label, 0]));
    let publishedToday = 0;
    const todayKey = new Date().toISOString().slice(0, 10);
    for (const item of items) {
      const topic = matchTopic(item.category?.name);
      if (topic) byTopic.set(topic, (byTopic.get(topic) ?? 0) + 1);
      (item.categoryIds ?? []).forEach((id) => {
        const region = regionIdByLabel.get(id);
        if (region) byRegion.set(region, (byRegion.get(region) ?? 0) + 1);
      });
      if (item.publishedAt?.slice(0, 10) === todayKey) publishedToday += 1;
    }
    const breaking = items.filter((i) => i.isBreaking);
    const recent = [...items]
      .sort((a, b) => Date.parse(b.publishedAt ?? "") - Date.parse(a.publishedAt ?? ""))
      .slice(0, 6);
    return {
      publishedToday,
      total: items.length,
      breaking,
      byTopic: Array.from(byTopic.entries()).sort((a, b) => b[1] - a[1]),
      byRegion: Array.from(byRegion.entries()).sort((a, b) => b[1] - a[1]),
      recent,
    };
  }, [items, regionIdByLabel]);

  if (!loaded) return null;

  return (
    <section className="bg-black text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--cnbc-red))] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[hsl(var(--cnbc-red))]" />
            </span>
            <h2 className="world-kicker text-xs font-black uppercase tracking-widest">Newsroom Pulse — Live</h2>
          </div>
          <span className="text-[11px] text-white/50">
            {lastFetched ? `Updated ${secondsAgo}s ago` : "Loading…"} · {stats.total} stories tracked
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coverage map */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Coverage by Topic</p>
              <div className="space-y-1">
                {stats.byTopic.map(([topic, count]) => (
                  <div key={topic} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-white/60">{topic}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(var(--cnbc-red))]"
                        style={{ width: `${stats.byTopic[0][1] ? (count / stats.byTopic[0][1]) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right font-semibold tabular-nums text-white/90">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Coverage by Region</p>
              <div className="space-y-1">
                {stats.byRegion.map(([region, count]) => (
                  <div key={region} className="flex items-center gap-2 text-xs">
                    <span className="w-24 shrink-0 truncate text-white/60">{region}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${stats.byRegion[0][1] ? (count / stats.byRegion[0][1]) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-5 shrink-0 text-right font-semibold tabular-nums text-white/90">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live feed */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2">Just Published</p>
            {stats.recent.length === 0 ? (
              <p className="text-xs text-white/50">No stories published yet.</p>
            ) : (
              <ul className="space-y-2">
                {stats.recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={newsArticleHref({ slug: item.slug, publishedAt: item.publishedAt ?? "", contentType: item.contentType })}
                      className="block text-xs text-white/20 hover:text-white hover:underline underline-offset-2 line-clamp-2"
                    >
                      {item.isBreaking && <span className="text-[hsl(var(--cnbc-red))] font-bold mr-1">BREAKING</span>}
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
