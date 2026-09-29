import { NextResponse } from 'next/server';
import { cmsGetPage, cmsGetPages } from '@/lib/cms';

// Content is now managed centrally in the Baalvion CMS (admin-platform console).
const MANAGED_ELSEWHERE = {
  error: 'Content is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const page = await cmsGetPage(slug);
    return page
      ? NextResponse.json(page)
      : NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json(await cmsGetPages());
}

export async function PUT() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function POST() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
