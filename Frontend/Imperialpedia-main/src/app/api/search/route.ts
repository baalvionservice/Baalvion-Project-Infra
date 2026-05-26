import { NextResponse } from 'next/server';
import { searchEntities } from '@/lib/utils/search';

/**
 * Global Search API Route.
 * Orchestrates the discovery of knowledge nodes.
 * Optimized with Cache-Control for repetitive discovery handshakes.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = searchEntities(q);
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Search API failure', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
