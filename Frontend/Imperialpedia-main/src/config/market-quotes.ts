/**
 * Single toggle for the `/markets/quote/[symbol]` pages (DJI, AAPL, BTC, ...).
 *
 * Taken offline from indexing (2026-08-25) pending Google AdSense approval —
 * ~50 auto-generated ticker pages reads to reviewers as the same
 * "thin/auto-generated content at scale" pattern GLOSSARY_LIVE already guards
 * against (see config/glossary.ts). Pages still render normally (price data,
 * charts, Mediapartners-Google crawling) — only search-engine indexing and
 * sitemap submission are held back.
 *
 * Flip to `true` once AdSense approves.
 */
export const MARKET_QUOTES_LIVE = false;
