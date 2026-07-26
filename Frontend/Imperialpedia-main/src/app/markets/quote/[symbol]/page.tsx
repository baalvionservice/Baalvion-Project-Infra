import React, { cache } from "react";
import Link from "next/link";
import NextImage from "next/image";
import nextDynamic from "next/dynamic";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAssetDetail, ALL_TRACKED_SYMBOLS } from "@/lib/data/marketsLoader";
import { getCompanyByTicker, getRelatedEntities } from "@/lib/data/loaders";
import { buildOverviewParagraph } from "@/lib/data/asset-overview-text";
import { buildMetadata } from "@/lib/seo";
import { structuredData } from "@/lib/seo/structured-data";
import { JsonLd } from "@/modules/seo-engine/components/JsonLd";
import { isAllowedImageHost } from "@/lib/safe-image";
import { entityRouteSegment, humanizeSlug } from "@/lib/utils/seo";
import { articleUrl } from "@/lib/data/article-url";
import { env } from "@/config/env";

const QuoteChart = nextDynamic(() =>
  import("@/components/markets/QuoteChart").then((m) => m.QuoteChart),
);

const CNBC_RED = "#E31937";
const GREEN = "#00A651";
const RANGES = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "MAX"] as const;

// Human-facing label per `asset_type` — drives the page title, FinancialProduct
// `category`, and the "Overview" line. Never guessed per-symbol, always derived
// from the same enum the backend stores.
const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: "Stock",
  crypto: "Cryptocurrency",
  forex: "Currency Pair",
  commodity: "Commodity",
  index: "Market Index",
  bond: "Bond Yield",
};

// Only mapped when a real hub route exists in this app (verified against
// src/app/<segment>/page.tsx) — an asset type with no safe destination (forex,
// index) is simply omitted from the breadcrumb/back-link rather than pointed
// at a route that doesn't exist.
const ASSET_TYPE_HUB: Partial<Record<string, { label: string; href: string }>> = {
  stock: { label: "Stocks", href: "/stocks" },
  crypto: { label: "Cryptocurrency", href: "/crypto" },
  commodity: { label: "Commodities", href: "/commodities" },
  bond: { label: "Bonds", href: "/bonds" },
};

interface PageProps {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ range?: string }>;
}

// Segment-level ISR: a live-quote page benefits from being cached and shared
// across concurrent visitors far more than from `force-dynamic` (which the
// previous implementation used) — force-dynamic also silently overrides the
// `next: { revalidate: 30 }` option already set on the underlying fetch in
// marketsLoader.ts, so every request was doing an uncached round-trip to
// imperialpedia-service for nothing. 30s matches that same fetch-level window.
export const revalidate = 30;
export const dynamicParams = true;

// Pre-render every symbol this site actually tracks (see MARKET_GROUPS in
// marketsLoader.ts) so the common pages are warm instead of cold on first hit;
// any symbol outside this set (dynamicParams=true) still resolves on demand.
export async function generateStaticParams() {
  return ALL_TRACKED_SYMBOLS.map((symbol) => ({ symbol }));
}

function resolveRange(range: string | undefined): (typeof RANGES)[number] {
  return (RANGES as readonly string[]).includes(range ?? "") ? (range as (typeof RANGES)[number]) : "1M";
}

// Shared between generateMetadata and the page component so the identical
// (symbol, range) lookup — including its downstream cms-service round-trip —
// runs once per request, not twice (React's documented cache() pattern).
const getDetailCached = cache(async (symbol: string, range: string) => getAssetDetail(symbol, range));

// Same rationale as getDetailCached: generateMetadata and the page component
// both look up the same symbol's company record.
const getCompanyCached = cache(async (symbol: string) => getCompanyByTicker(symbol));

function truncate(text: string, max = 157): string {
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const validRange = resolveRange((await searchParams).range);
  const detail = await getDetailCached(symbol, validRange);

  if (!detail) {
    return buildMetadata({ title: "Quote Not Found", noIndex: true });
  }

  const typeLabel = ASSET_TYPE_LABELS[detail.asset_type] ?? "Market Instrument";
  const title =
    detail.asset_type === "stock"
      ? `${detail.name} (${detail.symbol}) Stock Price, Quote & Chart`
      : `${detail.name} (${detail.symbol}) Price, Quote & Chart`;

  const company = await getCompanyCached(detail.symbol);
  const description = truncate(
    company?.description || detail.ai_summary || buildOverviewParagraph(detail, typeLabel),
  );
  const ogImage = company?.logo && isAllowedImageHost(company.logo) ? company.logo : undefined;

  return buildMetadata({
    title,
    description,
    keywords: [
      detail.name,
      detail.symbol,
      detail.exchange,
      typeLabel,
      company?.industry ? humanizeSlug(company.industry) : null,
    ].filter((v): v is string => Boolean(v)),
    canonical: `/markets/quote/${detail.symbol}`,
    ogType: "website",
    ogImage,
  });
}

const fmt = (v: number | string | null | undefined, dec = 2) =>
  v == null ? "—" : Number(v).toLocaleString("en-US", { maximumFractionDigits: dec });

const fmtMarketCap = (v: number | string | null | undefined) => {
  if (v == null) return "—";
  const n = Number(v);
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  return `$${n.toLocaleString()}`;
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0">
      <span className="text-[12px] text-white/50">{label}</span>
      <span className="text-[12px] font-mono font-semibold text-white tabular-nums">{value}</span>
    </div>
  );
}

const PERF_ROWS: { key: "today" | "week" | "month" | "ytd" | "oneYear" | "fiveYear"; label: string }[] = [
  { key: "today", label: "Today" }, { key: "week", label: "Week" }, { key: "month", label: "Month" },
  { key: "ytd", label: "YTD" }, { key: "oneYear", label: "1 Year" }, { key: "fiveYear", label: "5 Year" },
];

export default async function QuotePage({ params, searchParams }: PageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const validRange = resolveRange((await searchParams).range);
  const detail = await getDetailCached(symbol, validRange);

  if (!detail) notFound();

  const company = await getCompanyCached(detail.symbol);
  const relatedEntities = company
    ? await getRelatedEntities(company as unknown as Parameters<typeof getRelatedEntities>[0])
    : [];

  const price = detail.current_price;
  const pct = detail.change_pct_24h != null ? Number(detail.change_pct_24h) : null;
  const up = (pct ?? 0) >= 0;

  const baseUrl = env.siteUrl.replace(/\/$/, "");
  const canonicalUrl = `${baseUrl}/markets/quote/${detail.symbol}`;
  const entityId = `${canonicalUrl}#entity`;
  const typeLabel = ASSET_TYPE_LABELS[detail.asset_type] ?? "Market Instrument";
  const hub = ASSET_TYPE_HUB[detail.asset_type];
  const description = company?.description || detail.ai_summary || buildOverviewParagraph(detail, typeLabel);
  const logoOk = !!company?.logo && isAllowedImageHost(company.logo);

  // "About" excerpt — only ever the company's real editorial profile, never
  // generated. Deliberately capped at the opening paragraph rather than the
  // full multi-paragraph text: that full profile already lives, verbatim, at
  // /companies/[slug] (via EntityEditorialOverview), and reproducing all of it
  // here would put identical long-form prose on two separately canonicalized
  // URLs. The quote page links to the full profile instead of duplicating it.
  const editorialParagraphs = (company?.editorialOverview ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const editorialExcerpt = editorialParagraphs[0];
  const hasMoreEditorial = editorialParagraphs.length > 1;

  // Same array powers the visible <nav> below and the BreadcrumbList JSON-LD —
  // kept as one source so they can never drift out of sync (see
  // ARTICLE_STANDARD.md §2). A hub crumb is only added when it maps to a real
  // route (ASSET_TYPE_HUB); there is deliberately no generic "/markets" crumb
  // since that route doesn't exist in this app.
  const breadcrumbItems: { name: string; item: string }[] = [
    { name: "Home", item: "/" },
    ...(hub ? [{ name: hub.label, item: hub.href }] : []),
    { name: `${detail.name} (${detail.symbol})`, item: `/markets/quote/${detail.symbol}` },
  ];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: breadcrumbItems.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${baseUrl}${it.item}`,
    })),
  };

  // Schema.org has no dedicated "Stock"/"Equity" type — Corporation is the
  // standard, Google-recognized markup for a page about a publicly traded
  // company (matches the `Corporation` type already used for company mentions
  // in src/app/[...slug]/page.tsx). Non-equity instruments (crypto, forex,
  // commodities, indices, bond yields) use FinancialProduct instead.
  const isStock = detail.asset_type === "stock";
  const schemaType = isStock ? "Corporation" : "FinancialProduct";

  const entitySchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": entityId,
    name: company?.name || detail.name,
    // Matches this codebase's existing entity-schema convention (see
    // structuredData.entity() / companies/[slug]/page.tsx): `url` is our own
    // page describing the entity, and any real external homepage goes under
    // `sameAs` below — not the other way around.
    url: canonicalUrl,
    ...(description ? { description } : {}),
    ...(isStock ? { tickerSymbol: detail.symbol } : {}),
    additionalProperty: [
      { "@type": "PropertyValue", name: "assetType", value: typeLabel },
      ...(detail.exchange ? [{ "@type": "PropertyValue", name: "exchange", value: detail.exchange }] : []),
    ],
  };

  if (company) {
    if (company.legalName) entitySchema.legalName = company.legalName;
    if (company.founded_year) entitySchema.foundingDate = String(company.founded_year);
    if (company.headquarters) entitySchema.address = company.headquarters;
    if (company.employees) {
      entitySchema.numberOfEmployees = { "@type": "QuantitativeValue", value: company.employees };
    }
    const sameAs = [...(company.sameAs ?? []), ...(company.website ? [company.website] : [])];
    if (sameAs.length) entitySchema.sameAs = sameAs;
    if (logoOk) entitySchema.logo = { "@type": "ImageObject", url: company.logo };
    if (company.founders?.length) {
      entitySchema.founder = company.founders.map((name) => ({ "@type": "Person", name }));
    }
    const leadership = [
      ...(company.ceo ? [{ name: company.ceo, jobTitle: "Chief Executive Officer" }] : []),
      ...(company.executives ?? []).map((e) => ({ name: e.name, jobTitle: e.title })),
    ];
    if (leadership.length) entitySchema.employee = leadership.map((p) => ({ "@type": "Person", ...p }));
    if (company.parentOrganization) {
      entitySchema.parentOrganization = { "@type": "Organization", name: company.parentOrganization };
    }
  }

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": canonicalUrl,
    url: canonicalUrl,
    name: `${detail.name} (${detail.symbol})`,
    ...(description ? { description } : {}),
    isPartOf: { "@type": "WebSite", name: "Imperialpedia", url: baseUrl },
    mainEntity: { "@id": entityId },
    breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
    // Points voice assistants / AI answer engines at the H1 + key-facts block
    // for a concise, extractable summary instead of the full page.
    speakable: structuredData.speakable(["h1", "[data-key-facts]"]),
  };

  const validHistorical = detail.historical.filter((h) => !Number.isNaN(Date.parse(h.date)));
  const datasetSchema =
    validHistorical.length > 1
      ? {
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `${detail.name} (${detail.symbol}) Historical Price Data`,
          description: `Historical daily open, high, low, close, and volume data for ${detail.name} (${detail.symbol}).`,
          url: canonicalUrl,
          variableMeasured: ["Open price", "High price", "Low price", "Close price", "Trading volume"],
          temporalCoverage: `${validHistorical[0].date}/${validHistorical[validHistorical.length - 1].date}`,
          creator: { "@type": "Organization", name: "Imperialpedia", url: baseUrl },
        }
      : null;

  // FAQPage is only ever built from real, editorially-authored Q&A pairs on
  // the matched company entity — never generated/guessed (see CompanyEntity.faq
  // doc comment and ARTICLE_STANDARD.md anti-patterns).
  const faqSchema = company?.faq?.length ? structuredData.faq(company.faq) : null;

  const chartSummary = [
    `${detail.name} price chart, ${validRange} range.`,
    price != null ? `Current price ${fmt(price)}${detail.exchange ? ` on ${detail.exchange}` : ""}.` : null,
    pct != null ? `${up ? "Up" : "Down"} ${Math.abs(pct).toFixed(2)}% over the selected range.` : null,
  ].filter(Boolean).join(" ");

  return (
    <main className="min-h-screen bg-black pb-24" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <JsonLd data={webPageSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={entitySchema} />
      {datasetSchema && <JsonLd data={datasetSchema} />}
      {faqSchema && <JsonLd data={faqSchema} />}

      <div style={{ background: CNBC_RED }} className="py-3">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link href={hub?.href ?? "/market-news"} className="text-[12px] font-semibold text-white/90 hover:underline">
            &larr; {hub?.label ?? "Markets"}
          </Link>
          {detail.marketStatus && (
            <span className="text-[11px] font-bold uppercase tracking-wide text-white bg-black/25 px-2 py-0.5 rounded-sm">
              {detail.marketStatus.label}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-4">
        <nav aria-label="Breadcrumb" className="text-[11px] text-white/40 flex items-center gap-1.5 flex-wrap">
          {breadcrumbItems.map((it, i) => {
            const isLast = i === breadcrumbItems.length - 1;
            return (
              <span key={it.item} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page" className="text-white/70">{it.name}</span>
                ) : (
                  <Link href={it.item} className="hover:text-white hover:underline">{it.name}</Link>
                )}
                {!isLast && <span aria-hidden="true">/</span>}
              </span>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {logoOk && (
            <NextImage
              src={company!.logo!}
              alt={`${company!.name} logo`}
              width={40}
              height={40}
              className="rounded-sm bg-white/5 object-contain"
            />
          )}
          <div>
            <h1 className="text-2xl font-black text-white">{detail.name}</h1>
            <p className="text-[12px] text-white/50">
              {detail.symbol} {detail.exchange && `· ${detail.exchange}`} · {typeLabel}
            </p>
          </div>
        </div>

        <div className="bg-[#111] border border-white/15 rounded-sm p-4">
          {price != null ? (
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black font-mono text-white tabular-nums">{fmt(price)}</span>
              {pct != null && (
                <span className="text-lg font-bold font-mono tabular-nums" style={{ color: up ? GREEN : CNBC_RED }}>
                  {up ? "▲" : "▼"} {Math.abs(pct).toFixed(2)}%
                </span>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-white/50">No live quote available.</p>
          )}
          <p className="mt-1 text-[11px] text-white/40">
            Last updated {detail.last_updated_at ? new Date(detail.last_updated_at).toLocaleTimeString("en-US", { timeZone: "America/New_York" }) + " ET" : "—"}
          </p>
        </div>

        {/* Key facts — plain-text, extractable block for AI answer engines
            (ChatGPT Search, Perplexity, Google AI Overviews) to quickly answer
            "what is this / what stock is this / which market". Only fields
            with real values render; nothing is ever templated in as filler. */}
        <div data-key-facts className="bg-[#111] border border-white/15 rounded-sm p-4">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Overview</h2>
          {description && <p className="text-[13px] text-white/70 leading-relaxed mb-3">{description}</p>}
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-[12px]">
            <div><dt className="text-white/40 uppercase text-[10px]">Ticker</dt><dd className="font-mono font-semibold text-white">{detail.symbol}</dd></div>
            <div><dt className="text-white/40 uppercase text-[10px]">Type</dt><dd className="text-white">{typeLabel}</dd></div>
            {detail.exchange && (
              <div><dt className="text-white/40 uppercase text-[10px]">Exchange</dt><dd className="text-white">{detail.exchange}</dd></div>
            )}
            {company?.industry && (
              <div>
                <dt className="text-white/40 uppercase text-[10px]">Industry</dt>
                <dd><Link href={`/industries/${company.industry}`} className="text-white hover:underline">{humanizeSlug(company.industry)}</Link></dd>
              </div>
            )}
            {company?.founded_year != null && (
              <div><dt className="text-white/40 uppercase text-[10px]">Founded</dt><dd className="text-white">{company.founded_year}</dd></div>
            )}
            {company?.headquarters && (
              <div><dt className="text-white/40 uppercase text-[10px]">Headquarters</dt><dd className="text-white">{company.headquarters}</dd></div>
            )}
          </dl>
        </div>

        <div className="bg-[#111] border border-white/15 rounded-sm p-4">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2 sr-only">Historical Chart</h2>
          <div role="group" aria-label="Chart time range" className="flex flex-wrap gap-1 mb-3">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/markets/quote/${symbol}?range=${r}`}
                aria-current={r === validRange ? "true" : undefined}
                className="px-2.5 py-1 text-[11px] font-bold rounded-sm"
                style={r === validRange ? { background: CNBC_RED, color: "#fff" } : { color: "rgba(255,255,255,0.5)" }}
              >
                {r}
              </Link>
            ))}
          </div>
          <p className="sr-only">{chartSummary}</p>
          <QuoteChart data={detail.chart} />
        </div>

        {detail.performance && (
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Performance</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PERF_ROWS.map(({ key, label }) => {
                const v = detail.performance![key];
                const rowUp = (v ?? 0) >= 0;
                return (
                  <div key={key} className="text-center border border-white/10 rounded-sm py-2">
                    <p className="text-[10px] text-white/40 uppercase">{label}</p>
                    <p className="text-[12px] font-mono font-bold tabular-nums" style={{ color: v == null ? "rgba(255,255,255,0.4)" : rowUp ? GREEN : CNBC_RED }}>
                      {v == null ? "—" : `${rowUp ? "+" : ""}${v.toFixed(2)}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Key Statistics</h2>
            <StatRow label="Market Cap" value={fmtMarketCap(detail.fundamentals?.marketCap ?? detail.market_cap)} />
            {detail.fundamentals && (
              <>
                <StatRow label="P/E Ratio" value={fmt(detail.fundamentals.peRatio)} />
                <StatRow label="52 Week High" value={fmt(detail.fundamentals.week52High)} />
                <StatRow label="52 Week Low" value={fmt(detail.fundamentals.week52Low)} />
                {detail.fundamentals.dividendYield != null && <StatRow label="Dividend Yield" value={`${detail.fundamentals.dividendYield.toFixed(2)}%`} />}
                {detail.fundamentals.industry && <StatRow label="Industry" value={detail.fundamentals.industry} />}
              </>
            )}
            {detail.volume && (
              <>
                <StatRow label="Volume" value={detail.volume.volume != null ? detail.volume.volume.toLocaleString() : "—"} />
                <StatRow label="Average Volume" value={detail.volume.averageVolume != null ? detail.volume.averageVolume.toLocaleString() : "—"} />
              </>
            )}
          </div>

          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Technical Indicators</h2>
            {detail.indicators ? (
              <>
                <StatRow label="SMA 20" value={fmt(detail.indicators.sma20)} />
                <StatRow label="SMA 50" value={fmt(detail.indicators.sma50)} />
                <StatRow label="SMA 200" value={fmt(detail.indicators.sma200)} />
                <StatRow label="RSI (14)" value={fmt(detail.indicators.rsi14)} />
                {detail.indicators.macd && <StatRow label="MACD Histogram" value={fmt(detail.indicators.macd.histogram)} />}
              </>
            ) : (
              <p className="text-[12px] text-white/40 py-4 text-center">Not available for this asset type.</p>
            )}
          </div>
        </div>

        {company && editorialExcerpt && (
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">
              About {company.name}
            </h2>
            <div className="space-y-3">
              <p className="text-[13px] text-white/70 leading-relaxed">{editorialExcerpt}</p>
              {hasMoreEditorial && (
                <p className="text-[10px] text-white/30">
                  <Link href={`/companies/${company.slug}`} className="hover:underline">
                    Read the full {company.name} profile &rarr;
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}

        {company && Boolean(company.founders?.length || company.ceo || company.executives?.length || company.headquarters || company.website || company.products?.length) && (
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Company Information</h2>
            {company.legalName && <StatRow label="Legal Name" value={company.legalName} />}
            {company.headquarters && <StatRow label="Headquarters" value={company.headquarters} />}
            {company.founded_year != null && <StatRow label="Founded" value={String(company.founded_year)} />}
            {company.employees != null && <StatRow label="Employees" value={company.employees.toLocaleString()} />}
            {company.ceo && <StatRow label="CEO" value={company.ceo} />}
            {company.founders && company.founders.length > 0 && <StatRow label="Founders" value={company.founders.join(", ")} />}
            {company.products && company.products.length > 0 && <StatRow label="Products" value={company.products.join(", ")} />}
            {company.website && (
              <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0">
                <span className="text-[12px] text-white/50">Website</span>
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-white hover:underline">
                  {company.website.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
            <p className="mt-2 text-[10px] text-white/30">
              Company profile: <Link href={`/companies/${company.slug}`} className="hover:underline">View full {company.name} profile &rarr;</Link>
            </p>
          </div>
        )}

        {(detail.relatedCompanies.length > 0 || relatedEntities.length > 0 || detail.relatedArticles.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(detail.relatedCompanies.length > 0 || relatedEntities.length > 0) && (
              <div className="bg-[#111] border border-white/15 rounded-sm p-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Related Companies &amp; Peers</h2>
                <div className="flex flex-wrap gap-2">
                  {detail.relatedCompanies.map((c) => (
                    <Link key={`sym-${c.symbol}`} href={`/markets/quote/${c.symbol}`} className="text-[11px] font-semibold text-white/80 border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/10">
                      {c.name}
                    </Link>
                  ))}
                  {relatedEntities.map((e) => (
                    <Link key={`ent-${e.type}-${e.slug}`} href={`/${entityRouteSegment(e.type)}/${e.slug}`} className="text-[11px] font-semibold text-white/80 border border-white/20 rounded-full px-2.5 py-1 hover:bg-white/10">
                      {e.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {detail.relatedArticles.length > 0 && (
              <div className="bg-[#111] border border-white/15 rounded-sm p-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Related News</h2>
                <div className="space-y-1.5">
                  {detail.relatedArticles.map((a) => (
                    <Link key={a.id} href={articleUrl(a.published_at, a.slug)} className="block text-[12px] text-white/80 hover:underline truncate">
                      • {a.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {company?.faq && company.faq.length > 0 && (
          <div className="bg-[#111] border border-white/15 rounded-sm p-4">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-2">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {company.faq.map((f) => (
                <div key={f.question}>
                  <p className="text-[13px] font-semibold text-white">{f.question}</p>
                  <p className="text-[12px] text-white/60 mt-0.5">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
