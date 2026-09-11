/**
 * Single toggle for the `/markets/quote/[symbol]` pages (DJI, AAPL, BTC, ...).
 *
 * Previously only held these pages back from indexing (2026-08-25). Now tied
 * to MARKETS_SECTION_LIVE — when the markets section is hidden, quote pages
 * redirect to / via next.config.ts and MARKET_QUOTES_LIVE gates away all
 * navigation links and sitemap entries. Flip MARKETS_SECTION_LIVE to `true`
 * in config/sections.ts once Google AdSense approval is received; this export
 * updates automatically.
 */
import { MARKETS_SECTION_LIVE } from "./sections";

export const MARKET_QUOTES_LIVE = MARKETS_SECTION_LIVE;
