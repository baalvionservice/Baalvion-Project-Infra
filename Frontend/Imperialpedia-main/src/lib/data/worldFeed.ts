/**
 * Live data layer for the CNBC-style World page (/world/?region=).
 *
 * Real data, fetched server-side with ISR caching, with graceful fallback to the
 * static demo set (./worldRegions) on any failure — the page can never break:
 *
 *   • Markets / indices / FX / commodities / crypto → Yahoo Finance (keyless)
 *   • Watchlist megacaps                             → Yahoo Finance (keyless)
 *   • News: hero, live "Latest", topical sections    → GDELT 2.0 doc API (keyless)
 *   • Owned editorial blended into the feed          → Baalvion CMS (cms-service)
 *
 * All upstream calls are keyless and run only on the server. Next's data cache
 * (`next.revalidate`) means each upstream is hit at most once per window
 * regardless of traffic, so the page stays fast and we never hammer Yahoo/GDELT.
 */

import type { CmsContent } from "@/services/data/cms-public";
import {
  getWorldData,
  resolveRegion,
  type FeaturedStory,
  type Indicator,
  type MarketRegionGroup,
  type RegionId,
  type WorldData,
} from "./worldRegions";

// ── Yahoo symbol config ─────────────────────────────────────────────────────

type Kind = "index" | "fx" | "commodity" | "crypto" | "yield";

interface SymbolDef {
  symbol: string;
  name: string;
  dec: number;
  suffix?: string;
  kind: Kind;
  /** Markets-panel grouping (used for the World view). */
  group?: "Americas" | "Europe" | "Asia-Pacific";
}

const s = (
  symbol: string,
  name: string,
  dec: number,
  kind: Kind,
  group?: SymbolDef["group"],
  suffix?: string,
): SymbolDef => ({ symbol, name, dec, kind, group, suffix });

const YAHOO_SYMBOLS: Record<RegionId, SymbolDef[]> = {
  world: [
    s("^DJI", "Dow Jones", 2, "index", "Americas"),
    s("^GSPC", "S&P 500", 2, "index", "Americas"),
    s("^IXIC", "Nasdaq", 2, "index", "Americas"),
    s("^BVSP", "Bovespa", 0, "index", "Americas"),
    s("^FTSE", "FTSE 100", 2, "index", "Europe"),
    s("^GDAXI", "DAX", 2, "index", "Europe"),
    s("^FCHI", "CAC 40", 2, "index", "Europe"),
    s("^N225", "Nikkei 225", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("GC=F", "Gold", 2, "commodity"),
    s("CL=F", "Crude (WTI)", 2, "commodity"),
    s("BTC-USD", "Bitcoin", 0, "crypto"),
    s("EURUSD=X", "EUR/USD", 4, "fx"),
  ],
  us: [
    s("^DJI", "Dow Jones", 2, "index", "Americas"),
    s("^GSPC", "S&P 500", 2, "index", "Americas"),
    s("^IXIC", "Nasdaq", 2, "index", "Americas"),
    s("^RUT", "Russell 2000", 2, "index", "Americas"),
    s("^TNX", "10-Yr Yield", 3, "yield", undefined, "%"),
    s("^VIX", "VIX", 2, "index"),
    s("GC=F", "Gold", 2, "commodity"),
    s("CL=F", "Crude (WTI)", 2, "commodity"),
  ],
  europe: [
    s("^FTSE", "FTSE 100", 2, "index", "Europe"),
    s("^GDAXI", "DAX", 2, "index", "Europe"),
    s("^FCHI", "CAC 40", 2, "index", "Europe"),
    s("^IBEX", "IBEX 35", 2, "index", "Europe"),
    s("^STOXX", "STOXX 600", 2, "index", "Europe"),
    s("FTSEMIB.MI", "FTSE MIB", 0, "index", "Europe"),
    s("EURUSD=X", "EUR/USD", 4, "fx"),
    s("BZ=F", "Brent", 2, "commodity"),
  ],
  asia: [
    s("^N225", "Nikkei 225", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("^KS11", "Kospi", 2, "index", "Asia-Pacific"),
    s("^AXJO", "ASX 200", 2, "index", "Asia-Pacific"),
    s("^BSESN", "Sensex", 2, "index", "Asia-Pacific"),
    s("^NSEI", "Nifty 50", 2, "index", "Asia-Pacific"),
    s("JPY=X", "USD/JPY", 2, "fx"),
  ],
  china: [
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("399001.SZ", "Shenzhen", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("000300.SS", "CSI 300", 2, "index", "Asia-Pacific"),
    s("399006.SZ", "ChiNext", 2, "index", "Asia-Pacific"),
    s("CNY=X", "USD/CNY", 4, "fx"),
  ],
  emerging: [
    s("^BVSP", "Bovespa", 0, "index", "Americas"),
    s("^BSESN", "Sensex", 2, "index", "Asia-Pacific"),
    s("^NSEI", "Nifty 50", 2, "index", "Asia-Pacific"),
    s("000001.SS", "Shanghai", 2, "index", "Asia-Pacific"),
    s("^HSI", "Hang Seng", 2, "index", "Asia-Pacific"),
    s("BRL=X", "USD/BRL", 4, "fx"),
    s("INR=X", "USD/INR", 2, "fx"),
  ],
};

const WATCHLIST_SYMBOLS: { symbol: string; name: string }[] = [
  { symbol: "AAPL", name: "Apple" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "NVDA", name: "Nvidia" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "JPM", name: "JPMorgan" },
];

// ── Admin World Control config (imperialpedia-service) ──────────────────────
// Editors control the markets, watchlist and feed settings from the admin
// panel; this reads that config. Falls back to the shipped defaults above.

const IMPERIALPEDIA_API =
  process.env.NEXT_PUBLIC_IMPERIALPEDIA_API_URL || "http://localhost:3004/api/v1";

interface WorldConfig {
  settings?: { newsFallback?: boolean; refreshSeconds?: number };
  watchlist?: { symbol: string; name: string }[];
  regions?: {
    id: string;
    label?: string;
    enabled?: boolean;
    indices?: Array<Partial<SymbolDef> & { symbol: string; name: string }>;
  }[];
}

async function getWorldConfig(): Promise<WorldConfig | null> {
  try {
    const res = await fetch(`${IMPERIALPEDIA_API}/world-config`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: WorldConfig };
    return json?.data ?? null;
  } catch {
    return null;
  }
}

const KINDS: Kind[] = ["index", "fx", "commodity", "crypto", "yield"];

function coerceDef(x: Partial<SymbolDef> & { symbol?: string; name?: string }): SymbolDef | null {
  if (!x?.symbol || !x?.name) return null;
  const kind = KINDS.includes(x.kind as Kind) ? (x.kind as Kind) : "index";
  const group =
    x.group === "Americas" || x.group === "Europe" || x.group === "Asia-Pacific"
      ? x.group
      : undefined;
  return {
    symbol: String(x.symbol),
    name: String(x.name),
    dec: Number.isFinite(x.dec) ? Number(x.dec) : 2,
    kind,
    group,
  };
}

// ── Yahoo fetch ─────────────────────────────────────────────────────────────

interface Quote {
  price: number;
  prev: number;
}

async function fetchYahooQuote(symbol: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?interval=1d&range=5d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`yahoo ${res.status} ${symbol}`);
  const json = (await res.json()) as {
    chart?: {
      result?: Array<{
        meta?: {
          regularMarketPrice?: number;
          chartPreviousClose?: number;
          previousClose?: number;
        };
      }>;
    };
  };
  const meta = json?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  if (!meta || price == null) throw new Error(`yahoo: no price for ${symbol}`);
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  return { price, prev };
}

const fmt = (n: number, dec: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

function toIndicator(def: SymbolDef, q: Quote): Indicator {
  const change = q.price - q.prev;
  const pct = q.prev !== 0 ? (change / q.prev) * 100 : 0;
  const positive = change >= 0;
  const sign = positive ? "+" : "";
  return {
    name: def.name,
    value: fmt(q.price, def.dec) + (def.suffix ?? ""),
    change: sign + fmt(change, def.dec),
    percent: sign + pct.toFixed(2) + "%",
    positive,
  };
}

/** Fetch indicators from Yahoo for the given symbol set; null if too few succeed. */
async function buildIndicators(defs: SymbolDef[]): Promise<Indicator[] | null> {
  if (!defs.length) return null;
  const settled = await Promise.allSettled(defs.map((d) => fetchYahooQuote(d.symbol)));
  const out: Indicator[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") out.push(toIndicator(defs[i], r.value));
  });
  // Require a healthy majority before trusting the live set over the fallback.
  return out.length >= Math.ceil(defs.length * 0.6) ? out : null;
}

/** Markets panel derived from the same region quotes (index instruments only). */
function buildMarkets(
  region: RegionId,
  indicators: Indicator[],
  defs: SymbolDef[],
): MarketRegionGroup[] {
  const byName = new Map(indicators.map((i) => [i.name, i]));
  const rows = defs
    .filter((d) => d.kind === "index" && byName.has(d.name))
    .map((d) => {
      const ind = byName.get(d.name)!;
      return {
        name: d.name,
        value: ind.value,
        change: ind.percent,
        positive: ind.positive,
        group: d.group ?? "Americas",
      };
    });
  if (region === "world") {
    const order: MarketRegionGroup["region"][] = ["Americas", "Europe", "Asia-Pacific"];
    return order
      .map((g) => ({
        region: g,
        markets: rows.filter((r) => r.group === g).map(({ group, ...m }) => m),
      }))
      .filter((g) => g.markets.length > 0);
  }
  return [
    {
      region: resolveRegion(region).label,
      markets: rows.map(({ group, ...m }) => m),
    },
  ];
}

async function buildWatchlist(
  symbols: { symbol: string; name: string }[],
): Promise<WorldData["watchlist"] | null> {
  if (!symbols.length) return null;
  const settled = await Promise.allSettled(symbols.map((w) => fetchYahooQuote(w.symbol)));
  const out: WorldData["watchlist"] = [];
  settled.forEach((r, i) => {
    if (r.status !== "fulfilled") return;
    const change = r.value.price - r.value.prev;
    const pct = r.value.prev !== 0 ? (change / r.value.prev) * 100 : 0;
    const positive = change >= 0;
    out.push({
      ticker: symbols[i].symbol,
      name: symbols[i].name,
      price: fmt(r.value.price, 2),
      change: (positive ? "+" : "") + pct.toFixed(2) + "%",
      positive,
    });
  });
  return out.length >= Math.min(5, symbols.length) ? out : null;
}

// ── Google News RSS (keyless) ───────────────────────────────────────────────
// Keyless and tolerant of normal traffic (unlike GDELT's 1-req/5s throttle).
// Returns RSS XML with no images — that's fine, news imagery comes from the
// allowlisted category map (safeImage) so CSP / next/image never break.

interface RawArticle {
  url: string;
  title: string;
  ms: number;
  domain?: string;
}

const decodeEntities = (s: string): string =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    // &amp; must be decoded LAST so ampersands produced by the replacements
    // above are not re-interpreted as the start of another entity (e.g. the
    // literal text "&amp;lt;" must decode to "&lt;", not "<").
    .replace(/&amp;/g, "&")
    .trim();

async function googleNews(query: string, max: number): Promise<RawArticle[]> {
  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query + " when:2d",
    )}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`googlenews ${res.status}`);
  const xml = await res.text();
  const out: RawArticle[] = [];
  const seen = new Set<string>();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const item of items) {
    const rawTitle = /<title>([\s\S]*?)<\/title>/.exec(item)?.[1];
    const link = /<link>([\s\S]*?)<\/link>/.exec(item)?.[1];
    const pub = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(item)?.[1];
    const src = /<source[^>]*>([\s\S]*?)<\/source>/.exec(item)?.[1];
    if (!rawTitle || !link) continue;
    let title = decodeEntities(rawTitle);
    const source = src ? decodeEntities(src) : undefined;
    // Google News titles are "Headline - Publisher" — strip the trailing source.
    if (source && title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim();
    }
    const ms = pub ? Date.parse(pub) : NaN;
    if (!title || seen.has(title)) continue;
    seen.add(title);
    out.push({
      title,
      url: decodeEntities(link),
      ms: Number.isFinite(ms) ? ms : Date.now(),
      domain: source,
    });
    if (out.length >= max) break;
  }
  return out;
}

const REGION_QUERY: Record<RegionId, string> = {
  world: "world stock market economy",
  us: "wall street stock market economy",
  europe: "european stock market economy",
  asia: "asia stock market economy",
  china: "china stock market economy",
  emerging: "emerging markets stocks economy",
};

// Result buckets, keyed by the category classifier, rendered as news sections.
const SECTION_DEFS: { section: string; cats: string[] }[] = [
  { section: "Markets & Economy", cats: ["MARKETS", "ECONOMY"] },
  { section: "Technology", cats: ["TECH", "CRYPTO"] },
  { section: "Politics & Policy", cats: ["POLITICS"] },
  { section: "Energy & Climate", cats: ["ENERGY"] },
];

function relativeTime(ms: number): string {
  if (!Number.isFinite(ms)) return "recently";
  const diffMin = Math.max(1, Math.round((Date.now() - ms) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const hrs = Math.round(diffMin / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// next/image + the app CSP only allow a short list of image hosts. Article
// thumbnails come from arbitrary news domains, so we never hotlink them — we map
// each story to an allowlisted, category-matched image (and pass through a
// remote image only when its host is already allowlisted, e.g. the CMS).
const CATEGORY_IMG: Record<string, string> = {
  MARKETS: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
  ECONOMY: "https://images.unsplash.com/photo-1521790945508-bf2a36314e85?w=800&q=80",
  TECH: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
  ENERGY: "https://images.unsplash.com/photo-1606159068539-43f36b99d1b2?w=800&q=80",
  POLITICS: "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80",
  CRYPTO: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
};
const FALLBACK_IMG = CATEGORY_IMG.MARKETS;

const ALLOWED_IMG_HOSTS = new Set([
  "images.unsplash.com",
  "picsum.photos",
  "placehold.co",
  "imperialpedia.com",
  "www.investopedia.com",
]);

/** Pass a remote image through only if its host is allowlisted, else use a
 * category-matched allowlisted image so next/image + CSP never break. */
function safeImage(url: string | null | undefined, category: string): string {
  if (url) {
    try {
      if (ALLOWED_IMG_HOSTS.has(new URL(url).hostname)) return url;
    } catch {
      /* malformed URL → fall through to category image */
    }
  }
  return CATEGORY_IMG[category] ?? FALLBACK_IMG;
}

function classifyCategory(title: string): string {
  const t = title.toLowerCase();
  if (/bitcoin|crypto|ethereum|token/.test(t)) return "CRYPTO";
  if (/\bai\b|chip|nvidia|apple|tech|software|semiconductor/.test(t)) return "TECH";
  if (/oil|energy|opec|crude|gas|climate/.test(t)) return "ENERGY";
  if (/fed|inflation|gdp|jobs|economy|rate|ecb/.test(t)) return "ECONOMY";
  if (/election|senate|policy|government|president|trump|biden/.test(t)) return "POLITICS";
  return "MARKETS";
}

function classifyPositive(title: string): boolean | null {
  const t = title.toLowerCase();
  if (/surge|jump|gain|rise|rally|soar|climb|beat|record high|rebound|up \d/.test(t))
    return true;
  if (/fall|drop|slump|plunge|sink|loss|miss|sell-?off|tumble|slide|down \d/.test(t))
    return false;
  return null;
}

interface NewsBundle {
  featured: FeaturedStory[];
  latest: WorldData["latest"];
  sections: WorldData["sections"];
}

async function buildNews(region: RegionId): Promise<NewsBundle | null> {
  // ONE Google News RSS call per region (cached), bucketed below.
  const arts = await googleNews(REGION_QUERY[region], 50);
  if (arts.length < 4) return null;

  const featured: FeaturedStory[] = arts.slice(0, 3).map((a, i) => {
    const category = classifyCategory(a.title);
    return {
      id: 1000 + i,
      category,
      headline: a.title,
      summary: a.domain ? `Latest from ${a.domain}.` : "",
      image: safeImage(undefined, category),
      time: relativeTime(a.ms),
      author: a.domain ?? "Newswire",
      tag: i === 0 ? "BREAKING" : null,
    };
  });

  const latest: WorldData["latest"] = arts.slice(3, 16).map((a, i) => ({
    id: 2000 + i,
    time: relativeTime(a.ms),
    category: classifyCategory(a.title),
    headline: a.title,
    positive: classifyPositive(a.title),
  }));

  // Bucket the remaining articles by category into topical sections.
  const buckets = new Map<string, RawArticle[]>();
  for (const a of arts.slice(3)) {
    const c = classifyCategory(a.title);
    (buckets.get(c) ?? buckets.set(c, []).get(c)!).push(a);
  }
  const sections: WorldData["sections"] = SECTION_DEFS.map((def, idx) => {
    const items = def.cats
      .flatMap((c) => buckets.get(c) ?? [])
      .slice(0, 4)
      .map((a, i) => ({
        id: 3000 + idx * 10 + i,
        headline: a.title,
        time: relativeTime(a.ms),
        image: i === 0 ? safeImage(undefined, classifyCategory(a.title)) : null,
      }));
    return { section: def.section, color: "#0a2463", items };
  }).filter((s) => s.items.length > 0);

  return { featured, latest, sections };
}

// ── CMS as the PRIMARY, admin-controlled news source ────────────────────────
// Whatever editors publish in the admin panel (cms-service) drives the World
// feed. Region targeting is by category: create a CMS category whose slug
// matches the region id (us, europe, asia, china, emerging) and assign content
// to it. Anything published also flows into the general feed.

// Live CMS read (own copy of the client) — no-store so published content shows
// up immediately. The World pages render dynamically (force-dynamic), so this
// fetch runs per-request rather than at build/ISR time.
const CMS_PUBLIC_URL =
  process.env.NEXT_PUBLIC_CMS_PUBLIC_URL || "http://localhost:3011/api/v1/public";
const CMS_SITE = process.env.NEXT_PUBLIC_CMS_SITE_SLUG || "imperialpedia";

async function cmsList(params: {
  contentType?: string;
  categorySlug?: string;
  limit?: number;
}): Promise<CmsContent[]> {
  const q = new URLSearchParams();
  if (params.contentType) q.set("contentType", params.contentType);
  if (params.categorySlug) q.set("categorySlug", params.categorySlug);
  if (params.limit) q.set("limit", String(params.limit));
  const res = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE}/content?${q.toString()}`, {
    headers: { Accept: "application/json" },
    // Editorial content changes on publish — read it LIVE per-request so the
    // World page reflects the CMS immediately (the page is rendered dynamically).
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`cms ${res.status}`);
  const env = (await res.json()) as { data?: CmsContent[] };
  return env.data ?? [];
}

const CMS_TIME = (c: CmsContent): string =>
  c.publishedAt ? relativeTime(Date.parse(c.publishedAt)) : "recently";

function mapCmsCategory(name: string | null | undefined, title: string): string {
  const n = (name ?? "").toLowerCase();
  if (/crypto|bitcoin/.test(n)) return "CRYPTO";
  if (/tech/.test(n)) return "TECH";
  if (/energy|climate|oil/.test(n)) return "ENERGY";
  if (/econom|inflation|\bfed\b/.test(n)) return "ECONOMY";
  if (/politic|policy|government/.test(n)) return "POLITICS";
  if (/market|stock|invest|business/.test(n)) return "MARKETS";
  return classifyCategory(title);
}

/** Newest published CMS content for the region (region category first, then general). */
async function fetchCmsItems(region: RegionId): Promise<CmsContent[]> {
  const calls = [
    cmsList({ contentType: "news", limit: 30 }).catch(() => [] as CmsContent[]),
    cmsList({ contentType: "article", limit: 30 }).catch(() => [] as CmsContent[]),
  ];
  // Region-targeted content (if a matching category exists) is prioritized.
  if (region !== "world") {
    calls.unshift(cmsList({ categorySlug: region, limit: 30 }).catch(() => [] as CmsContent[]));
  }
  const results = await Promise.all(calls);
  const seen = new Set<string>();
  const merged: CmsContent[] = [];
  for (const items of results) {
    for (const it of items) {
      if (it.id && !seen.has(it.id)) {
        seen.add(it.id);
        merged.push(it);
      }
    }
  }
  merged.sort(
    (a, b) =>
      Date.parse(b.publishedAt ?? b.updatedAt ?? "") -
      Date.parse(a.publishedAt ?? a.updatedAt ?? ""),
  );
  return merged;
}

async function buildCmsNews(region: RegionId): Promise<NewsBundle | null> {
  const items = await fetchCmsItems(region);
  if (items.length < 4) return null;

  const featured: FeaturedStory[] = items.slice(0, 3).map((c, i) => {
    const category = mapCmsCategory(c.category?.name, c.title);
    return {
      id: 1000 + i,
      category,
      headline: c.title,
      summary: c.excerpt ?? "",
      image: safeImage(c.featuredImage, category),
      time: CMS_TIME(c),
      author: "Imperialpedia",
      tag: i === 0 ? "EXCLUSIVE" : null,
    };
  });

  const latest: WorldData["latest"] = items.slice(3, 16).map((c, i) => ({
    id: 2000 + i,
    time: CMS_TIME(c),
    category: mapCmsCategory(c.category?.name, c.title),
    headline: c.title,
    positive: classifyPositive(c.title),
  }));

  const buckets = new Map<string, CmsContent[]>();
  for (const c of items.slice(3)) {
    const k = mapCmsCategory(c.category?.name, c.title);
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(c);
  }
  const sections: WorldData["sections"] = SECTION_DEFS.map((def, idx) => {
    const its = def.cats
      .flatMap((k) => buckets.get(k) ?? [])
      .slice(0, 4)
      .map((c, i) => ({
        id: 3000 + idx * 10 + i,
        headline: c.title,
        time: CMS_TIME(c),
        image: i === 0 ? safeImage(c.featuredImage, mapCmsCategory(c.category?.name, c.title)) : null,
      }));
    return { section: def.section, color: "#0a2463", items: its };
  }).filter((s) => s.items.length > 0);

  return { featured, latest, sections };
}

// ── timestamp ───────────────────────────────────────────────────────────────

function nowEt(): string {
  try {
    const formatted = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `As of ${formatted} ET`;
  } catch {
    return `As of ${new Date().toUTCString()}`;
  }
}

// ── public API ──────────────────────────────────────────────────────────────

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * Region-scoped World data: REAL live markets (Yahoo) + admin-controlled news.
 *
 * News precedence:
 *   1. CMS (admin panel) — the source of truth once editors publish content.
 *   2. Google News — automatic fallback so the page is never empty pre-launch.
 *   3. Static demo set — last-resort fallback if every upstream is down.
 *
 * Markets, watchlist and timestamp are always live (Yahoo), falling back to the
 * static set only if Yahoo is unavailable.
 */
export async function getWorldDataLive(raw?: string | null): Promise<WorldData> {
  const fallback = getWorldData(raw);
  const region = fallback.region;

  // Admin World Control config (markets, watchlist, settings). Falls back to
  // the shipped defaults per-field if absent.
  const config = await safe(() => getWorldConfig());
  const cfgRegion = config?.regions?.find((r) => r.id === region.id);
  const cfgDefs = (cfgRegion?.indices?.map(coerceDef).filter(Boolean) ?? []) as SymbolDef[];
  const defs = cfgDefs.length ? cfgDefs : YAHOO_SYMBOLS[region.id];
  const watch =
    config?.watchlist?.length
      ? config.watchlist.map((w) => ({ symbol: String(w.symbol), name: String(w.name) }))
      : WATCHLIST_SYMBOLS;
  const newsFallbackEnabled = config?.settings?.newsFallback !== false;
  const enabledRegions = config?.regions
    ? (config.regions.filter((r) => r.enabled !== false).map((r) => r.id) as RegionId[])
    : undefined;

  const [indicators, watchlist, cmsNews] = await Promise.all([
    safe(() => buildIndicators(defs)),
    safe(() => buildWatchlist(watch)),
    safe(() => buildCmsNews(region.id)),
  ]);

  // Admin/CMS wins. Reach for Google News only when the CMS is empty AND the
  // admin left the wire-service fallback enabled.
  let news = cmsNews;
  if (!news && newsFallbackEnabled) news = await safe(() => buildNews(region.id));

  const markets = indicators ? buildMarkets(region.id, indicators, defs) : fallback.markets;

  return {
    region,
    asOf: indicators ? nowEt() : fallback.asOf,
    indicators: indicators ?? fallback.indicators,
    markets,
    featured: news?.featured?.length ? news.featured : fallback.featured,
    latest: news?.latest?.length ? news.latest : fallback.latest,
    sections: news?.sections?.length ? news.sections : fallback.sections,
    watchlist: watchlist ?? fallback.watchlist,
    enabledRegions,
  };
}
