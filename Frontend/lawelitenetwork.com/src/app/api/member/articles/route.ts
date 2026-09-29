import { NextResponse } from 'next/server';
import { getArticlesBySlugs } from '@/lib/member-feed';

export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get('slugs') || '').split(',').filter(Boolean);
  const items = await getArticlesBySlugs(slugs);
  return NextResponse.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } });
}
