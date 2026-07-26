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
