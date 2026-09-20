import { NextResponse } from 'next/server';
import { describeEntities, getFeedForEntities, parseEntityQuery } from '@/lib/member-feed';

// Takes public entity slugs only. The member's follow list lives in law-service
// behind their token; this route never sees who is asking.
export async function GET(req: Request) {
  const follows = parseEntityQuery(new URL(req.url).searchParams.get('e'));
  const items = await getFeedForEntities(follows);
  return NextResponse.json({ items, entities: describeEntities(follows) }, { headers: { 'Cache-Control': 'private, no-store' } });
}
