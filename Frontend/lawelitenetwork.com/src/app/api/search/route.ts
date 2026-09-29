import { NextRequest, NextResponse } from 'next/server';
import { searchAll, type SearchResultType } from '@/lib/global-search';

export const dynamic = 'force-dynamic';

/**
 * Global LEN search — spans Articles, People, Movies/TV/Music, Sports,
 * Legal Cases/Courts, and Topics (see @/lib/global-search.ts). Previously
 * this route only searched articles; every consumer (SearchBar, the /search
 * page) now gets a `type` per result and can filter via `?types=person,court`.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const limit = Number(req.nextUrl.searchParams.get('limit')) || 50;
  const typesParam = req.nextUrl.searchParams.get('types');
  const types = typesParam
    ? (typesParam.split(',').filter(Boolean) as SearchResultType[])
    : undefined;

  if (!q) return NextResponse.json({ data: { items: [] } });

  const items = await searchAll(q, { limit, types });
  return NextResponse.json({ data: { items } });
}
