import { NextResponse } from 'next/server';
import { searchService } from '@/services/data/search-service';

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

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const { data, error, status } = await searchService.performSearch(q);
    if (error) {
      return NextResponse.json({ error }, { status: status || 500 });
    }
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Search API failure', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
