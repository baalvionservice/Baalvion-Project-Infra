import { NextResponse } from 'next/server';
import { cmsGetArticles, cmsGetArticle } from '@/lib/cms';

// Content is now managed centrally in the Baalvion CMS (admin-platform console).
const MANAGED_ELSEWHERE = {
  error: 'Content is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 48;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');
  const pageParam = searchParams.get('page');

  if (slug) {
    const article = await cmsGetArticle(slug);
    return article
      ? NextResponse.json(article)
      : NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const all = await cmsGetArticles(category || undefined);

  // Paginated mode (opt-in via ?page=). The CMS delivery API cannot filter news by the
  // frontend's `customFields.category`, so the category filter — and therefore the
  // paging — is applied here over the full set. Returns an envelope with pagination meta
  // so the listing UI can render real Previous/Next controls and scale to large archives.
  if (pageParam !== null) {
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(Number(pageParam) || 1, 1), totalPages);
    const start = (page - 1) * limit;
    return NextResponse.json({
      items: all.slice(start, start + limit),
      pagination: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  }

  // Legacy mode (search, admin): the full array.
  return NextResponse.json(all);
}

export async function POST() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function PUT() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function DELETE() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
