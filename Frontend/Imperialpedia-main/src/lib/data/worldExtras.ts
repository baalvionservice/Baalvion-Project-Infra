/**
 * Real, keyless data for the extra World homepage modules (Market Movers,
 * Trending Now, Special Reports, United Kingdom). Same sourcing policy as
 * worldFeed.ts: Yahoo Finance for quotes/screeners, Google News RSS for
 * headlines — both free, no API key, safe within normal traffic. Every
 * function fails soft (returns null) so a caller can fall back to the
 * static demo set rather than break the page.
 */

import { classifyCategory, fetchYahooQuote, googleNews, relativeTime } from "./worldFeed";

const fmt = (n: number, dec = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

const fmtVolume = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
};

// ── Market Movers (Most Active / Unusual Volume) ────────────────────────────

export interface MoverRow {
  ticker: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  volume: string;
  note?: string;
}

interface ScreenerQuote {
  symbol?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  averageDailyVolume3Month?: number;
}

async function fetchScreener(scrId: string, count: number): Promise<ScreenerQuote[]> {
  const url = `https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?formatted=false&lang=en-US&region=US&scrIds=${scrId}&count=${count}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ImperialpediaBot/1.0)" },
    next: { revalidate: 90 },
  });
  if (!res.ok) throw new Error(`yahoo screener ${res.status} ${scrId}`);
  const json = (await res.json()) as { finance?: { result?: Array<{ quotes?: ScreenerQuote[] }> } };
  return json?.finance?.result?.[0]?.quotes ?? [];
}

function toMoverRow(q: ScreenerQuote, note?: string): MoverRow | null {
  if (!q.symbol || q.regularMarketPrice == null) return null;
  const pct = q.regularMarketChangePercent ?? 0;
  return {
    ticker: q.symbol,
    name: q.shortName ?? q.symbol,
    price: fmt(q.regularMarketPrice),
    change: (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%",
    positive: pct >= 0,
    volume: q.regularMarketVolume != null ? fmtVolume(q.regularMarketVolume) : "—",
    note,
  };
}

export async function getMostActive(): Promise<MoverRow[] | null> {
  try {
    const quotes = await fetchScreener("most_actives", 8);
    const rows = quotes.map((q) => toMoverRow(q)).filter((r): r is MoverRow => r !== null);
    return rows.length >= 5 ? rows : null;
  } catch {
    return null;
  }
}

/** "Unusual volume" computed from real data: today's volume vs. the 3-month
 * average, sorted by the ratio — genuinely derived, not a hardcoded list. */
export async function getUnusualVolume(): Promise<MoverRow[] | null> {
  try {
    const quotes = await fetchScreener("most_actives", 25);
    const ranked = quotes
      .filter((q) => q.regularMarketVolume && q.averageDailyVolume3Month)
      .map((q) => ({ q, ratio: q.regularMarketVolume! / q.averageDailyVolume3Month! }))
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 8);
    const rows = ranked
      .map(({ q, ratio }) => toMoverRow(q, `${ratio.toFixed(1)}x avg`))
      .filter((r): r is MoverRow => r !== null);
    return rows.length >= 5 ? rows : null;
  } catch {
    return null;
  }
}

// ── Trending Now ─────────────────────────────────────────────────────────

export async function getTrendingNow(): Promise<string[] | null> {
  try {
    const arts = await googleNews("stock market business economy world", 8);
    const headlines = arts.map((a) => a.title);
    return headlines.length >= 5 ? headlines : null;
  } catch {
    return null;
  }
}

// ── Special Reports ─────────────────────────────────────────────────────

export interface ReportTile {
  id: number;
  title: string;
  dek: string;
  category: string;
}

export async function getSpecialReports(): Promise<ReportTile[] | null> {
  try {
    const arts = await googleNews("markets economy technology world business", 25);
    const seenCategories = new Set<string>();
    const picks: ReportTile[] = [];
    for (const a of arts) {
      const category = classifyCategory(a.title);
      if (seenCategories.has(category)) continue;
      seenCategories.add(category);
      picks.push({
        id: picks.length + 1,
        title: a.title,
        dek: a.domain ? `Live coverage from ${a.domain}.` : "Live coverage.",
        category,
      });
      if (picks.length >= 3) break;
    }
    return picks.length === 3 ? picks : null;
  } catch {
    return null;
  }
}

// ── United Kingdom ───────────────────────────────────────────────────────

export interface UkStory {
  id: number;
  category: string;
  headline: string;
  time: string;
}

export interface UkIndicator {
  value: string;
  change: string;
  percent: string;
  positive: boolean;
}

export interface UkData {
  ftse: UkIndicator | null;
  main: UkStory;
  secondary: UkStory[];
}

export async function getUnitedKingdom(): Promise<UkData | null> {
  try {
    const [arts, ftseQuote] = await Promise.all([
      googleNews("UK stock market economy", 6),
      fetchYahooQuote("^FTSE").catch(() => null),
    ]);
    if (arts.length < 3) return null;

    const [mainArt, ...restArts] = arts;
    const main: UkStory = {
      id: 1,
      category: classifyCategory(mainArt.title),
      headline: mainArt.title,
      time: relativeTime(mainArt.ms),
    };
    const secondary: UkStory[] = restArts.slice(0, 3).map((a, i) => ({
      id: i + 2,
      category: classifyCategory(a.title),
      headline: a.title,
      time: relativeTime(a.ms),
    }));

    let ftse: UkIndicator | null = null;
    if (ftseQuote) {
      const change = ftseQuote.price - ftseQuote.prev;
      const pct = ftseQuote.prev !== 0 ? (change / ftseQuote.prev) * 100 : 0;
      ftse = {
        value: fmt(ftseQuote.price),
        change: (change >= 0 ? "+" : "") + fmt(change),
        percent: (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%",
        positive: change >= 0,
      };
    }

    return { ftse, main, secondary };
  } catch {
    return null;
  }
}
