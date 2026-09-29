import { NextResponse } from 'next/server';
import { cmsGetPages, cmsGetProjects, cmsGetArticles } from '@/lib/cms';

// Read-only SEO inventory across CMS-managed content. SEO metadata is edited per
// content item in the central Baalvion CMS admin console.
const MANAGED_ELSEWHERE = {
  error: 'SEO metadata is managed centrally in the Baalvion CMS admin console.',
  console: process.env.NEXT_PUBLIC_CMS_CONSOLE_URL || 'http://localhost:3030/cms',
};

export async function GET() {
  const [pages, projects, articles] = await Promise.all([
    cmsGetPages(),
    cmsGetProjects(),
    cmsGetArticles(),
  ]);

  const combined = [
    ...pages.map((p) => ({ id: p.slug, type: 'Page', name: p.title, url: `/${p.slug === 'home' ? '' : p.slug}`, seo: p.seo })),
    ...projects.map((p) => ({ id: p.id, type: 'Project', name: p.name, url: `/projects/${p.id}`, seo: p.seo })),
    ...articles.map((a) => ({ id: a.id, type: 'Article', name: a.title, url: `/news/${a.category}/${a.slug}`, seo: a.seo })),
  ];

  return NextResponse.json(combined);
}

export async function PUT() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
export async function POST() {
  return NextResponse.json(MANAGED_ELSEWHERE, { status: 410 });
}
