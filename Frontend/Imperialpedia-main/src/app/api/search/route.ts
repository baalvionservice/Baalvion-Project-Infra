import { NextResponse } from 'next/server';
import { searchService } from '@/services/data/search-service';
import { getAllMarketAssets } from '@/lib/data/marketsLoader';
import { getArticles } from '@/modules/content-engine/services/content-service';

const POPULAR_SYMBOLS_COUNT = 5;
const TRENDING_COUNT = 6;

/**
 * Global Search API Route.
 * Orchestrates the discovery of knowledge nodes — companies, countries, industries,
 * technologies, live market assets, AND published CMS content (articles/news/glossary
 * terms) via `searchService.performSearch`, which merges imperialpedia-service entities
 * with the CMS content feed. Backs the Ctrl+K command palette (`SearchModal`).
 *
 * Previously called `searchEntities` directly, which only covers static entity
 * loaders (countries/companies/technologies/market assets) and never queried
 * articles or news at all — so the command palette could never surface content,
 * unlike the full `/search` page which already used `searchService`.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  // No query yet — the command palette shouldn't sit empty until the user
  // types. Surface the same live market feed and CMS articles the homepage
  // already draws from (never invented placeholder rows) as a "popular /
  // trending" default, the same way most command palettes greet an open
  // search box with something rather than nothing.
  if (!q || q.length < 2) {
    try {
      const [assets, articlesRes] = await Promise.all([
        getAllMarketAssets(),
        getArticles(1, TRENDING_COUNT),
      ]);
      const popularSymbols = assets
        .filter((a) => a.current_price != null)
        .slice(0, POPULAR_SYMBOLS_COUNT);
      return NextResponse.json({ popularSymbols, trending: articlesRes.data });
    } catch (error) {
      console.error('Search default-state fetch failed', error);
      return NextResponse.json({ popularSymbols: [], trending: [] });
    }
  }

  try {
    const { data, error } = await searchService.performSearch(q);
    if (error) {
      // performSearch already caught the failure and still returns its normal
      // `data: []` shape — every caller (SearchModal, SearchResults) expects
      // this route to always resolve to an array. Discarding `data` here and
      // returning `{ error }` instead (the previous behavior) handed callers
      // a bare object where they call `.map()`, crashing the results list
      // instead of just showing "no results".
      console.error('Search API upstream failure', error);
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Search API failure', error);
    // Same reasoning as above: callers always expect an array back from this
    // route, so an unexpected failure still resolves to `[]` rather than an
    // object that breaks `results.map(...)`.
    return NextResponse.json([], { status: 500 });
  }
}
