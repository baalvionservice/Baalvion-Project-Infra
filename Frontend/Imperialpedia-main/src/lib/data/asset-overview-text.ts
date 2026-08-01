import type { AssetDetail } from "./marketsLoader";

const fmt = (v: number | string | null | undefined, dec = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: dec });

const fmtMarketCap = (v: number | string | null | undefined) => {
  if (v == null) return null;
  const n = Number(v);
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

// Stable per-symbol index (not random — same symbol must always produce the
// same text across requests/revalidations) used to pick between a few
// equivalent phrasings for the two sentences present on nearly every page.
// Purely to avoid hundreds of pages sharing one identical sentence skeleton;
// each variant states the same facts, nothing is added or omitted by variant.
function symbolPick(symbol: string, variantCount: number): number {
  let sum = 0;
  for (let i = 0; i < symbol.length; i++) sum += symbol.charCodeAt(i);
  return sum % variantCount;
}

/**
 * Deterministic, fact-only Overview paragraph built purely from AssetDetail
 * fields — used as the last-resort fallback on /markets/quote/[symbol] when
 * there is no `company.description` and no CMS `ai_summary` (true for every
 * crypto, forex, commodity, index, and bond page, plus any stock without a
 * matched CompanyEntity yet). Each sentence only appears when its underlying
 * field is present — nothing is guessed or templated as filler — but since
 * price, performance, range, and volume differ per symbol, the output is
 * genuinely unique per page rather than a reused shell.
 */
export function buildOverviewParagraph(detail: AssetDetail, typeLabel: string): string {
  const sentences: string[] = [];

  const exchangePart = detail.exchange ? ` on ${detail.exchange}` : "";
  const identityVariants = [
    `${detail.name} (${detail.symbol}) is a ${typeLabel.toLowerCase()} tracked${exchangePart}.`,
    `${detail.symbol} — ${detail.name} — trades${exchangePart || " publicly"} as a ${typeLabel.toLowerCase()}.`,
  ];
  sentences.push(identityVariants[symbolPick(detail.symbol, identityVariants.length)]);

  const price = detail.current_price;
  const pct = detail.change_pct_24h != null ? Number(detail.change_pct_24h) : null;
  if (price != null) {
    const changePart = pct != null ? `, ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(2)}% over the past 24 hours` : "";
    const priceVariants = [
      `It last traded at ${fmt(price)}${changePart}.`,
      `The most recent price was ${fmt(price)}${changePart}.`,
    ];
    sentences.push(priceVariants[symbolPick(detail.symbol, priceVariants.length)]);
  }

  const perf = detail.performance;
  if (perf?.ytd != null || perf?.oneYear != null) {
    const parts: string[] = [];
    if (perf.ytd != null) parts.push(`${perf.ytd >= 0 ? "gained" : "lost"} ${Math.abs(perf.ytd).toFixed(2)}% year-to-date`);
    if (perf.oneYear != null) parts.push(`moved ${perf.oneYear >= 0 ? "up" : "down"} ${Math.abs(perf.oneYear).toFixed(2)}% over the past year`);
    sentences.push(`${detail.name} has ${parts.join(" and ")}.`);
  }

  const f = detail.fundamentals;
  if (f?.week52High != null && f?.week52Low != null) {
    sentences.push(`Its 52-week range spans ${fmt(f.week52Low)} to ${fmt(f.week52High)}.`);
  }
  if (f?.marketCap) {
    const cap = fmtMarketCap(f.marketCap);
    if (cap) sentences.push(`Market capitalization stands at ${cap}.`);
  }
  if (f?.peRatio != null) {
    sentences.push(`It trades at a price-to-earnings ratio of ${fmt(f.peRatio)}.`);
  }
  if (f?.dividendYield != null) {
    sentences.push(`The current dividend yield is ${f.dividendYield.toFixed(2)}%.`);
  }

  if (detail.volume?.volume != null) {
    const avgPart =
      detail.volume.averageVolume != null
        ? `, compared with an average of ${detail.volume.averageVolume.toLocaleString()}`
        : "";
    sentences.push(`Trading volume came in at ${detail.volume.volume.toLocaleString()}${avgPart}.`);
  }

  return sentences.join(" ");
}

/**
 * Generic, factually-accurate-per-asset-class explainer of how price and
 * (where applicable) market capitalization work for a given asset type —
 * `/markets/quote/[symbol]` pages for crypto/commodity/index/forex/bond
 * symbols have no company record and no performance/fundamentals feed today
 * (unlike stocks, which get a full company profile), so this is the only
 * substantive educational content available for them. Deliberately type-level
 * rather than symbol-level: these mechanics are the same for every symbol of
 * a given asset type, so nothing here is invented or guessed per-symbol —
 * only the name/typeLabel are interpolated.
 */
export function buildMarketMechanicsParagraph(assetType: string, name: string): string | null {
  switch (assetType) {
    case "stock":
      return (
        `${name}'s market capitalization is calculated by multiplying its total shares outstanding — the number of ` +
        `shares the company has actually issued to shareholders, as reported in its financial filings — by the ` +
        `current share price. It changes constantly as the share price moves, and also shifts whenever the company ` +
        `issues new shares, buys back existing ones, or splits its stock. Market cap is a market-value measure, not ` +
        `a statement of the company's assets or revenue: two companies with identical market caps can have very ` +
        `different underlying financials.`
      );
    case "crypto":
      return (
        `${name}'s market capitalization is calculated the same way for any cryptocurrency: circulating supply ` +
        `(the number of coins currently in public circulation, excluding any that are locked, burned, or not yet ` +
        `issued) multiplied by the current price per coin. Unlike a company's share count, circulating supply isn't ` +
        `set by a corporate filing — it's determined by the protocol's own issuance schedule and is typically ` +
        `tracked by data aggregators like CoinMarketCap or CoinGecko. Price itself is set by trading activity across ` +
        `exchanges: each exchange runs its own order book matching buyers and sellers, and the price quoted here is ` +
        `an aggregate across major venues rather than a single centralized listing.`
      );
    case "commodity":
      return (
        `${name} doesn't have a market capitalization in the way a stock or cryptocurrency does — there's no fixed, ` +
        `countable supply of outstanding units to multiply by price. Instead, its price is set by global supply and ` +
        `demand in spot and futures markets: producers, industrial buyers, and speculators trade standardized ` +
        `contracts on commodity exchanges, and the quoted price reflects the most recent trade or settlement price ` +
        `for the nearest active contract. Prices move on real-world supply shocks (weather, geopolitics, production ` +
        `changes) and demand shifts (economic growth, industrial usage, currency strength) more than on any single ` +
        `company's performance.`
      );
    case "index":
      return (
        `${name} is a market index, not a single tradable security — its value is a weighted average of the prices ` +
        `of the companies or assets it tracks, recalculated continuously as those underlying prices move. Investors ` +
        `can't buy the index directly; exposure typically comes through index funds, ETFs, or futures contracts ` +
        `designed to track it. Because it aggregates many holdings, an index's day-to-day move reflects the combined ` +
        `performance of its constituents rather than any single company's news.`
      );
    case "forex":
      return (
        `${name} is a currency pair, and its "price" is an exchange rate — how much of the second currency it takes ` +
        `to buy one unit of the first. That rate floats based on relative supply and demand for each currency, driven ` +
        `by factors like interest-rate differentials between the two countries' central banks, trade flows, and ` +
        `broader risk sentiment. Forex trades continuously across a decentralized global network of banks and ` +
        `brokers rather than a single exchange, so the quoted price is an aggregate of interbank rates.`
      );
    case "bond":
      return (
        `${name} tracks a bond yield, which moves inversely to bond price: when investors sell bonds and prices ` +
        `fall, the yield (the effective annual return a buyer locks in at the new, lower price) rises, and vice ` +
        `versa. Yields are driven primarily by expectations for the central bank's benchmark interest rate, ` +
        `inflation expectations, and the perceived credit risk of the issuer — for government bonds, that mostly ` +
        `means shifting expectations about future rate policy rather than default risk.`
      );
    default:
      return null;
  }
}
