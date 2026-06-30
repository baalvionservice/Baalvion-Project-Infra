import { NextResponse } from 'next/server';
import { cmsGetAuthors } from '@/lib/cms';

/** Same-origin BFF listing CMS-managed author profiles (empty until seeded). */
export const dynamic = 'force-dynamic';

export async function GET() {
  const authors = await cmsGetAuthors();
  return NextResponse.json({ data: authors });
}
