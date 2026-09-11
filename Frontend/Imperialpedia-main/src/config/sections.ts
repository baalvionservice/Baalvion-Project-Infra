/**
 * Gates for sections whose template is finished but whose content isn't, in the
 * same spirit as GLOSSARY_LIVE (config/glossary.ts) and MARKET_QUOTES_LIVE
 * (config/market-quotes.ts).
 *
 * An empty-but-elaborate section is worse for an AdSense review than no section
 * at all: it reads as "site under construction", which is a documented
 * disapproval reason. Both surfaces below shipped that way — /reviews rendered
 * a category grid, a six-question FAQ and a "0+ Reviews & Comparisons" counter
 * directly above the words "No reviews published yet", and /news rendered an
 * eight-tab newsroom (Markets · Business · Investing · Politics · World ·
 * Finance · Real Estate · Personal Finance) over two articles, the newer of
 * them nine days old.
 *
 * These gates hide a section from the footer, the sitemap and search indexing.
 * They delete no route and unpublish nothing: the two real news articles stay
 * live and indexable at their own dated URLs, and stay linked from /world and
 * /market-news.
 */

/**
 * The reviews section has never published a single review. Flip to `true` in
 * the same change that publishes the first ones — ReviewsHub already renders
 * whatever `reviewSlugs` contains.
 */
export const REVIEWS_SECTION_LIVE = false;

/**
 * Master switch for the newsroom hubs (/news, /latest). Flip to `true` once the
 * newsroom is genuinely being published into; `newsHubIsLive` still holds the
 * hubs back until the article count clears the threshold below, so turning this
 * on early can't resurrect a two-story newsroom.
 */
export const NEWS_SECTION_LIVE = false;

/**
 * How many published news items the newsroom hubs need before they're presented
 * as a section of the site.
 *
 * The hubs previously appeared as soon as a single item existed, which is what
 * put an eight-tab newsroom fronting two articles into the sitemap. Eight is
 * roughly the point at which the template's rails (breaking, trending, today's
 * highlights, latest feed, editor's picks) stop repeating the same two stories
 * back at the reader.
 */
export const NEWS_HUB_MIN_ARTICLES = 8;

/**
 * Whether /news and /latest should be linked, indexed and submitted, given how
 * many news items are actually published. Single decision point so the footer,
 * the sitemap and each hub's own robots meta can't disagree — the footer checks
 * NEWS_SECTION_LIVE alone (it has no count to hand), which is the necessary
 * half of this condition, so it can only ever be more conservative, never less.
 */
export function newsHubIsLive(publishedCount: number): boolean {
  return NEWS_SECTION_LIVE && publishedCount >= NEWS_HUB_MIN_ARTICLES;
}

/**
 * The curated `/stocks/lists/*` and `/stocks/indexes/*` reference pages
 * (data/stock-lists, data/indexes).
 *
 * Held back from indexing for two reasons at once. They're thin — a list page
 * is ~100 words of its own prose plus however many companies match its tags,
 * which for "AI Stocks" is three — and they're orphaned: StocksHub.tsx was the
 * only thing that ever linked them, and nothing under src/app has imported it
 * since /stocks moved to CategoryFeed, so all 19 are unreachable from the live
 * site while still being submitted to Google. An unreachable thin page is the
 * clearest possible version of the pattern MARKET_QUOTES_LIVE already guards
 * against.
 *
 * Flip to `true` in the change that links them from /stocks and gives each one
 * enough substance to stand on its own. The pages keep rendering meanwhile, so
 * anyone holding a link still gets the content.
 */
export const STOCK_REFERENCE_PAGES_LIVE = false;

/**
 * Master switch for the Market News and Markets section (/market-news, /markets,
 * /markets/*, /markets/quote/*).
 *
 * Hidden pending Google AdSense approval.
 * Flip to `true` once Google AdSense approval is received to restore all
 * market pages, quotes, widgets, and navigation links.
 */
export const MARKETS_SECTION_LIVE = false;
