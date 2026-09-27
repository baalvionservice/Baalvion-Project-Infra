import { NextResponse } from 'next/server';
import { PRIMARY_NAV, type NavSection } from '@/lib/site-nav';
import { getLiveCategorySlugs } from '@/lib/category-visibility';

/**
 * PublicNavbar is a client component (interactive mobile drawer), so it
 * can't directly await the server-only CMS read category-visibility.ts
 * needs. This route does that fetch server-side (reusing the same cached
 * CMS content read every other page on the site already uses) and hands
 * back just the nav sections that have crossed LIVE_THRESHOLD -- see
 * category-visibility.ts for the actual rule.
 */
const slugFromHref = (href: string) => href.replace(/^\//, '').split('/')[0];

export async function GET() {
  const live = await getLiveCategorySlugs();
  const sections: NavSection[] = PRIMARY_NAV.filter((s) => live.has(slugFromHref(s.href)));
  return NextResponse.json({ sections });
}
