
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const ADMIN_KEY = "secure-admin-key";

function isAuthorized(req: Request) {
  const key = req.headers.get('x-admin-key');
  return key === ADMIN_KEY;
}

export async function GET() {
  const pages = db.pages.getAll();
  const projects = db.projects.getAll();
  const articles = db.articles.getAll();

  const combined = [
    ...pages.map(p => ({ id: p.id, type: 'Page', name: p.title, url: `/${p.slug === 'home' ? '' : p.slug}`, seo: p.seo })),
    ...projects.map(p => ({ id: p.id, type: 'Project', name: p.name, url: `/projects/${p.id}`, seo: p.seo })),
    ...articles.map(a => ({ id: a.id, type: 'Article', name: a.title, url: `/news/${a.category}/${a.slug}`, seo: a.seo })),
  ];

  return NextResponse.json(combined);
}

export async function PUT(req: Request) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  
  const data = await req.json();
  const { id, type, seo } = data;

  if (type === 'Page') db.pages.update(id, { seo });
  if (type === 'Project') db.projects.update(id, { seo });
  if (type === 'Article') db.articles.update(id, { seo });

  return NextResponse.json({ success: true });
}
