import type { LiveCategory } from "./types";

export interface LatestCategoryCopy {
  title: string;
  intro: string;
}

/**
 * Server-rendered heading + intro copy for each /latest/[category] page.
 * The feed itself (LatestNewsClient) is entirely client-fetched from a
 * polling webhook — no article data is ever present in the server-rendered
 * HTML — so without this, a crawler sees only the client component's static
 * placeholder text. Distinct from the copy in topic-config.ts's OVERRIDES
 * (used by the separate, CMS-backed /economy, /market-news, etc. hub pages)
 * so the two don't duplicate each other: this copy is framed around what a
 * *live, continuously-refreshing* feed is and how to use it, not the subject
 * matter itself.
 */
export const LATEST_CATEGORY_COPY: Record<Exclude<LiveCategory, "All">, LatestCategoryCopy> = {
  Markets: {
    title: "Live Markets News",
    intro:
      "This feed streams market-moving stories as they're published — index moves, sector rotations, and the day's biggest stock swings — refreshing continuously rather than batching into a once-a-day digest. Because markets can react to a headline within seconds, a live feed is built for tracking what's happening right now; select any story to open the full detail panel with source attribution and key takeaways.",
  },
  Stocks: {
    title: "Live Stock News",
    intro:
      "Real-time coverage of individual company stories — earnings surprises, guidance changes, upgrades and downgrades, and other stock-specific news — as it's published rather than compiled into a later summary. Because a single headline about one company can move its share price within minutes of publication, this feed prioritizes speed of delivery; each card links through to the full story and source.",
  },
  Crypto: {
    title: "Live Crypto News",
    intro:
      "Digital-asset headlines, protocol updates, and price-moving announcements, refreshed continuously to match a market that trades around the clock rather than during fixed exchange hours. Crypto news can move prices faster and more sharply than in traditional equity markets, which is why this feed is built to surface new stories as soon as they're published instead of on a scheduled cadence.",
  },
  Economy: {
    title: "Live Economic News",
    intro:
      "Real-time coverage of economic data releases, central bank commentary, and policy developments as they're reported — the kind of news that often moves markets within minutes of release. This feed is meant for following a fast-moving economic story as it develops, rather than as a substitute for the deeper explainers found on Imperialpedia's dedicated economy topic pages.",
  },
  Banking: {
    title: "Live Banking News",
    intro:
      "Ongoing coverage of bank earnings, interest-rate-driven product changes, and developments across the banking sector, delivered as stories are published rather than in a periodic roundup. Banking news often has immediate relevance to savings and loan rates, which is why this feed favors immediacy — each entry links to the original reporting for full context.",
  },
  Startups: {
    title: "Live Startup News",
    intro:
      "Funding rounds, product launches, and notable moves from venture-backed companies, streamed as they're announced. Startup news tends to break across many small outlets simultaneously rather than through a handful of major wires, so this feed is designed to aggregate and surface those stories quickly rather than wait for a consolidated daily summary.",
  },
  GlobalMarkets: {
    title: "Live Global Markets News",
    intro:
      "Market-moving headlines from outside the U.S. — regional index moves, currency developments, and international economic news — refreshed continuously to reflect that global markets operate across overlapping time zones rather than a single trading session. This feed is meant to surface international stories as they publish, whatever the hour in any single market.",
  },
  PersonalFinance: {
    title: "Live Personal Finance News",
    intro:
      "Real-time consumer-finance stories — rate changes affecting savers and borrowers, new financial products, and regulatory updates — as they're published. Because changes like a shifting savings rate or a new fee structure can affect a reader's decisions immediately, this feed favors speed; for structured, evergreen guidance rather than breaking news, see Imperialpedia's dedicated personal finance guides.",
  },
  RealEstate: {
    title: "Live Real Estate News",
    intro:
      "Ongoing coverage of housing-market data, mortgage-rate moves, and property-market developments as they're reported, rather than compiled into a periodic digest. Real estate news is closely tied to interest-rate announcements, so this feed is built to surface a rate-driven story quickly; each entry links through to the original source for full detail.",
  },
};
